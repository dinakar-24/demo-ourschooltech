import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';
import { X, Download, Share, MoreVertical, Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function InstallAppBanner() {
  const { tenant } = useTenant();
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  // Show banner after a short delay
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Don't show on /install page (it has its own UI), or if already installed, or dismissed
  if (location.pathname === '/install') return null;
  if (isInstalled || dismissed || !visible) return null;

  const isAndroid = /Android/i.test(navigator.userAgent);

  const handleInstall = async () => {
    if (canInstall) {
      await promptInstall();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[60] animate-in slide-in-from-bottom-4 duration-500 md:left-auto md:right-4 md:bottom-4 md:max-w-sm">
      <div className="rounded-2xl border border-border bg-card shadow-xl p-4">
        <div className="flex items-start gap-3">
          {/* School logo */}
          {tenant?.logo && (
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
              <img src={tenant.logo} alt={tenant.name} className="max-w-full max-h-full object-contain" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">
              Install {tenant?.appDisplayName || tenant?.name || 'School App'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {canInstall
                ? 'Add to your home screen for quick access'
                : isIOS
                  ? 'Tap Share → Add to Home Screen'
                  : isAndroid
                    ? 'Tap ⋮ menu → Install App'
                    : 'Add to your home screen for quick access'}
            </p>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground shrink-0 p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Native install prompt (Chrome/Edge on Android/Desktop) */}
        {canInstall && (
          <Button onClick={handleInstall} className="w-full mt-3 h-9 rounded-xl text-sm font-semibold gap-2" size="sm">
            <Download className="w-4 h-4" />
            Install App
          </Button>
        )}

        {/* iOS instructions */}
        {isIOS && !canInstall && (
          <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <Share className="w-4 h-4 shrink-0 text-primary" />
            <span>Tap the <strong className="text-foreground">Share</strong> button, then <strong className="text-foreground">Add to Home Screen</strong></span>
          </div>
        )}

        {/* Android fallback (when beforeinstallprompt didn't fire) */}
        {isAndroid && !canInstall && !isIOS && (
          <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <MoreVertical className="w-4 h-4 shrink-0 text-primary" />
            <span>Tap <strong className="text-foreground">⋮ menu</strong> → <strong className="text-foreground">Install App</strong> or <strong className="text-foreground">Add to Home Screen</strong></span>
          </div>
        )}

        {/* Desktop fallback */}
        {!canInstall && !isIOS && !isAndroid && (
          <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <Plus className="w-4 h-4 shrink-0 text-primary" />
            <span>Use your browser's <strong className="text-foreground">Install</strong> option to add this app</span>
          </div>
        )}
      </div>
    </div>
  );
}
