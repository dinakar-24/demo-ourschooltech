import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { X, Download, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DISMISS_KEY = 'pwa-install-dismissed';
const MAX_WIDTH_TABLET = 1024;

function useIsTabletOrMobile() {
  const [matches, setMatches] = useState(() => window.innerWidth < MAX_WIDTH_TABLET);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MAX_WIDTH_TABLET - 1}px)`);
    const onChange = () => setMatches(window.innerWidth < MAX_WIDTH_TABLET);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return matches;
}

export function InstallAppBanner() {
  const { tenant, isSubdomain } = useTenant();
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();
  const isTabletOrMobile = useIsTabletOrMobile();
  const [dismissed, setDismissed] = useState(() => {
    const stored = localStorage.getItem(DISMISS_KEY);
    if (!stored) return false;
    const dismissedAt = parseInt(stored, 10);
    return Date.now() - dismissedAt < 24 * 60 * 60 * 1000;
  });
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Don't show on non-subdomain, /install page, already installed, dismissed, or desktop
  if (!isSubdomain) return null;
  if (!isTabletOrMobile) return null;
  if (location.pathname === '/install') return null;
  if (isInstalled || dismissed || !visible) return null;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const accepted = await promptInstall();
      if (accepted) {
        setShowSuccess(true);
      }
    } catch (err: any) {
      if (err?.message === 'INSTALL_NOT_AVAILABLE') {
        toast.error(
          'Installation requires opening this site directly in Chrome or Edge (not inside another app).',
          { duration: 5000 }
        );
      } else {
        toast.error('Something went wrong. Try again.');
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  const schoolName = tenant?.appDisplayName || tenant?.name || 'School App';
  const schoolLogo = tenant?.logo;

  return (
    <>
      <div className="fixed bottom-4 left-3 right-3 z-[60] animate-in slide-in-from-bottom-4 duration-500 md:left-auto md:right-4 md:bottom-4 md:max-w-sm">
        <div className="rounded-2xl border border-border bg-card shadow-2xl p-4">
          <div className="flex items-start gap-3">
            {schoolLogo && (
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white flex items-center justify-center border border-border">
                <img src={schoolLogo} alt={schoolName} className="w-10 h-10 object-contain" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">
                Install {schoolName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get the app for a better experience
              </p>
            </div>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground shrink-0 p-1 -mt-1 -mr-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={handleInstall}
            disabled={installing}
            className="w-full mt-3 h-10 rounded-xl text-sm font-bold gap-2"
            size="sm"
          >
            <Download className="w-4 h-4" />
            {installing ? 'Installing...' : 'Install App'}
          </Button>
        </div>
      </div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader>
            <DialogTitle className="sr-only">Installation Successful</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            {schoolLogo && (
              <img src={schoolLogo} alt={schoolName} className="w-16 h-16 object-contain" />
            )}
            <h3 className="text-lg font-bold text-foreground">{schoolName}</h3>
            <p className="text-sm text-muted-foreground">App installed successfully! You can now access it from your home screen.</p>
            <Button onClick={() => setShowSuccess(false)} className="w-full mt-2">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}