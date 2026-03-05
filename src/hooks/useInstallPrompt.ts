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
    console.log('[PWA] Listening for beforeinstallprompt…');
    console.log('[PWA] isInstalled:', isInstalled);
    console.log('[PWA] Protocol:', window.location.protocol);
    console.log('[PWA] In iframe:', window.self !== window.top);

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      console.log('[PWA] ✅ beforeinstallprompt event received!');
      deferredPrompt.current = e;
      setCanInstall(true);

      // Resolve any pending waiters
      resolveWaiters.current.forEach(resolve => resolve(e));
      resolveWaiters.current = [];
    };

    window.addEventListener('beforeinstallprompt', handler);

    const installed = () => {
      console.log('[PWA] ✅ App installed!');
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

    // If not ready, wait up to 10 seconds for the browser event
    if (!event) {
      console.log('[PWA] Waiting for beforeinstallprompt event…');
      event = await new Promise<BeforeInstallPromptEvent | null>((resolve) => {
        // Register a waiter that the event handler will resolve
        const timeout = setTimeout(() => {
          console.log('[PWA] ❌ Timed out waiting for beforeinstallprompt');
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

    console.log('[PWA] Triggering install prompt…');
    await event.prompt();
    const { outcome } = await event.userChoice;
    console.log('[PWA] User choice:', outcome);
    deferredPrompt.current = null;
    setCanInstall(false);
    return outcome === 'accepted';
  }, []);

  return { canInstall, isInstalled, promptInstall };
}
