import { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function useInstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const resolveWaiters = useRef<Array<(event: BeforeInstallPromptEvent) => void>>([]);

  const isInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true;

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanInstall(true);

      resolveWaiters.current.forEach(resolve => resolve(e));
      resolveWaiters.current = [];
    };

    window.addEventListener('beforeinstallprompt', handler);

    const installed = () => {
      setCanInstall(false);
      deferredPrompt.current = null;
    };
    window.addEventListener('appinstalled', installed);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, [isInstalled]);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    let event = deferredPrompt.current;

    if (!event) {
      event = await new Promise<BeforeInstallPromptEvent | null>((resolve) => {
        const timeout = setTimeout(() => {
          resolve(null);
        }, 10000);

        resolveWaiters.current.push((e) => {
          clearTimeout(timeout);
          resolve(e);
        });
      });
    }

    if (!event) {
      throw new Error('INSTALL_NOT_AVAILABLE');
    }

    await event.prompt();
    const { outcome } = await event.userChoice;
    deferredPrompt.current = null;
    setCanInstall(false);
    return outcome === 'accepted';
  }, []);

  return { canInstall, isInstalled, promptInstall };
}
