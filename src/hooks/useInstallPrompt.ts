import { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';

export function useInstallPrompt() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(DISMISS_KEY) === 'true';
  });
  const [hasPrompt, setHasPrompt] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const resolveWaitRef = useRef<((event: BeforeInstallPromptEvent) => void) | null>(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      promptRef.current = promptEvent;
      setHasPrompt(true);

      // If someone is waiting for the prompt, resolve it
      if (resolveWaitRef.current) {
        resolveWaitRef.current(promptEvent);
        resolveWaitRef.current = null;
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    const installHandler = () => {
      setIsInstalled(true);
      promptRef.current = null;
      setHasPrompt(false);
    };
    window.addEventListener('appinstalled', installHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installHandler);
    };
  }, []);

  // Wait for the prompt to become available (up to timeout ms)
  const waitForPrompt = useCallback((timeout = 8000): Promise<BeforeInstallPromptEvent | null> => {
    if (promptRef.current) return Promise.resolve(promptRef.current);

    return new Promise((resolve) => {
      resolveWaitRef.current = resolve;
      setTimeout(() => {
        resolveWaitRef.current = null;
        resolve(promptRef.current);
      }, timeout);
    });
  }, []);

  const triggerInstall = useCallback(async (): Promise<boolean> => {
    // If we already have the prompt, use it directly
    if (promptRef.current) {
      promptRef.current.prompt();
      const { outcome } = await promptRef.current.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        promptRef.current = null;
        setHasPrompt(false);
        return true;
      }
      return false;
    }

    // Otherwise wait for the prompt (click itself may trigger engagement)
    const event = await waitForPrompt(8000);
    if (event) {
      event.prompt();
      const { outcome } = await event.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        promptRef.current = null;
        setHasPrompt(false);
        return true;
      }
      return false;
    }

    return false;
  }, [waitForPrompt]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    localStorage.setItem(DISMISS_KEY, 'true');
  }, []);

  const canInstall = (hasPrompt || true) && !isInstalled && !isDismissed;

  return { canInstall, triggerInstall, isInstalled, dismiss, isDismissed, hasPrompt };
}
