import { useTenant } from '@/contexts/TenantContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowLeft, Download, Smartphone, Monitor } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const BASE_DOMAIN = 'ourschooltech.com';
const MAX_WIDTH_TABLET = 1024;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= MAX_WIDTH_TABLET);
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${MAX_WIDTH_TABLET}px)`);
    const onChange = () => setIsDesktop(window.innerWidth >= MAX_WIDTH_TABLET);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
}

export default function PublicInstallPage() {
  const { tenant, isSubdomain } = useTenant();
  const { isInstalled, promptInstall } = useInstallPrompt();
  const [installing, setInstalling] = useState(false);
  const isDesktop = useIsDesktop();

  const portalUrl = isSubdomain && tenant
    ? `https://${tenant.subdomain}.${BASE_DOMAIN}`
    : window.location.origin;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const accepted = await promptInstall();
      if (accepted) {
        toast.success('App installed successfully!');
      }
    } catch (err: any) {
      if (err?.message === 'INSTALL_NOT_AVAILABLE') {
        toast.error(
          'Please open this page directly in Chrome or Edge browser to install the app.',
          { duration: 5000 }
        );
      } else {
        toast.error('Something went wrong. Try again.');
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    toast.success('Link copied to clipboard');
  };

  const schoolName = tenant?.appDisplayName || tenant?.name || 'School Portal';
  const schoolLogo = tenant?.logo;

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center p-4 relative"
      style={{
        background: tenant?.primaryColor
          ? `linear-gradient(160deg, ${tenant.primaryColor}15 0%, ${tenant.primaryColor}05 40%, ${tenant.backgroundColor || '#ffffff'} 60%)`
          : undefined,
      }}
    >
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          {schoolLogo && (
            <div className="w-20 h-20 mx-auto flex items-center justify-center overflow-hidden shrink-0">
              <img src={schoolLogo} alt={schoolName} className="max-w-full max-h-full object-contain" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">{schoolName}</h1>
            <p className="text-sm text-muted-foreground mt-1">Install as a mobile app</p>
          </div>
        </div>

        {isInstalled ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium text-emerald-700">App is already installed!</p>
          </div>
        ) : isDesktop ? (
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <Monitor className="w-5 h-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              Scan the QR code below from your phone or tablet to install the app.
            </p>
          </div>
        ) : (
          <Button
            onClick={handleInstall}
            disabled={installing}
            className="w-full h-12 rounded-xl text-base font-semibold gap-2"
            size="lg"
            style={{ backgroundColor: tenant?.primaryColor }}
          >
            {installing ? (
              <>
                <Smartphone className="w-5 h-5 animate-pulse" />
                Installing...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Install App
              </>
            )}
          </Button>
        )}

        <div className="rounded-xl border bg-card p-5 text-center space-y-3 shadow-sm">
          <h3 className="font-semibold text-foreground text-sm">Share with Others</h3>
          <p className="text-xs text-muted-foreground">Scan to open the school portal on your phone</p>
          <div className="inline-block p-3 bg-white rounded-xl">
            <QRCodeSVG
              value={portalUrl}
              size={180}
              level="H"
              imageSettings={schoolLogo ? {
                src: schoolLogo,
                height: 36,
                width: 36,
                excavate: true,
              } : undefined}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="w-full">
            Copy Portal Link
          </Button>
        </div>

        <div className="text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </div>
      </div>

    </div>
  );
}