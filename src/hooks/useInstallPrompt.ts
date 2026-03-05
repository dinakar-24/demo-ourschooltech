import { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  const isInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true;

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const installed = () => setCanInstall(false);
    window.addEventListener('appinstalled', installed);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  // Wait for the prompt event with polling (up to 8 seconds)
  const waitForPrompt = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (deferredPrompt.current) {
        resolve(true);
        return;
      }
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 200;
        if (deferredPrompt.current) {
          clearInterval(interval);
          resolve(true);
        } else if (elapsed >= 8000) {
          clearInterval(interval);
          resolve(false);
        }
      }, 200);
    });
  }, []);

  const promptInstall = useCallback(async () => {
    // If not ready yet, wait for the browser event
    if (!deferredPrompt.current) {
      const ready = await waitForPrompt();
      if (!ready) return false;
    }
    await deferredPrompt.current!.prompt();
    const { outcome } = await deferredPrompt.current!.userChoice;
    deferredPrompt.current = null;
    setCanInstall(false);
    return outcome === 'accepted';
  }, [waitForPrompt]);

  return { canInstall, isInstalled, promptInstall };
}
