import { useTenant } from '@/contexts/TenantContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';
import { Smartphone, Share, Plus, MoreVertical, CheckCircle2, ArrowLeft, Download, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const BASE_DOMAIN = 'ourschooltech.com';

export default function PublicInstallPage() {
  const { tenant, isSubdomain } = useTenant();
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  // Show install banner after a short delay
  useEffect(() => {
    const timer = setTimeout(() => setBannerVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const portalUrl = isSubdomain && tenant
    ? `https://${tenant.subdomain}.${BASE_DOMAIN}`
    : window.location.origin;

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      toast.success('App installed successfully!');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    toast.success('Link copied to clipboard');
  };

  const schoolName = tenant?.appDisplayName || tenant?.name || 'School Portal';
  const schoolLogo = tenant?.logo;
  const isAndroid = /Android/i.test(navigator.userAgent);

  const showBanner = bannerVisible && !bannerDismissed && !isInstalled;

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center p-4 relative"
      style={{
        background: tenant?.primaryColor
          ? `linear-gradient(160deg, ${tenant.primaryColor}15 0%, ${tenant.primaryColor}05 40%, ${tenant.backgroundColor || '#ffffff'} 60%)`
          : undefined,
      }}
    >
      {/* Floating install banner - visible immediately on this page */}
      {showBanner && (
        <div className="fixed bottom-4 left-3 right-3 z-[60] animate-in slide-in-from-bottom-4 duration-500 md:left-auto md:right-4 md:max-w-sm">
          <div className="rounded-2xl border border-border bg-card shadow-xl p-4">
            <div className="flex items-start gap-3">
              {schoolLogo && (
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
                  <img src={schoolLogo} alt={schoolName} className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  Install {schoolName}
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
              <button onClick={() => setBannerDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0 p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {canInstall && (
              <Button onClick={handleInstall} className="w-full mt-3 h-9 rounded-xl text-sm font-semibold gap-2" size="sm">
                <Download className="w-4 h-4" />
                Install App
              </Button>
            )}

            {isIOS && !canInstall && (
              <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <Share className="w-4 h-4 shrink-0 text-primary" />
                <span>Tap the <strong className="text-foreground">Share</strong> button, then <strong className="text-foreground">Add to Home Screen</strong></span>
              </div>
            )}

            {isAndroid && !canInstall && !isIOS && (
              <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <MoreVertical className="w-4 h-4 shrink-0 text-primary" />
                <span>Tap <strong className="text-foreground">⋮ menu</strong> → <strong className="text-foreground">Install App</strong></span>
              </div>
            )}

            {!canInstall && !isIOS && !isAndroid && (
              <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <Plus className="w-4 h-4 shrink-0 text-primary" />
                <span>Use your browser's <strong className="text-foreground">Install</strong> option to add this app</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main page content */}
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          {schoolLogo && (
            <div className="w-20 h-20 mx-auto flex items-center justify-center overflow-hidden shrink-0">
              <img src={schoolLogo} alt={schoolName} className="max-w-full max-h-full object-contain" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{schoolName}</h1>
            <p className="text-sm text-gray-500 mt-1">Install as a mobile app</p>
          </div>
        </div>

        {isInstalled && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium text-emerald-700">App is already installed!</p>
          </div>
        )}

        {canInstall && !isInstalled && (
          <Button
            onClick={handleInstall}
            className="w-full h-12 rounded-xl text-base font-semibold gap-2"
            size="lg"
            style={{ backgroundColor: tenant?.primaryColor }}
          >
            <Smartphone className="w-5 h-5" />
            Install App
          </Button>
        )}

        {isIOS && !isInstalled && (
          <div className="rounded-xl border bg-white p-5 space-y-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 text-sm">Install on iPhone / iPad</h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${tenant?.primaryColor}15` }}>
                  <Share className="w-3.5 h-3.5" style={{ color: tenant?.primaryColor }} />
                </div>
                <p className="text-sm text-gray-600">Tap the <strong className="text-gray-900">Share</strong> button in Safari</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${tenant?.primaryColor}15` }}>
                  <Plus className="w-3.5 h-3.5" style={{ color: tenant?.primaryColor }} />
                </div>
                <p className="text-sm text-gray-600">Tap <strong className="text-gray-900">Add to Home Screen</strong></p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${tenant?.primaryColor}15` }}>
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: tenant?.primaryColor }} />
                </div>
                <p className="text-sm text-gray-600">Tap <strong className="text-gray-900">Add</strong> to install</p>
              </li>
            </ol>
          </div>
        )}

        {!canInstall && !isIOS && !isInstalled && (
          <div className="rounded-xl border bg-white p-5 space-y-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 text-sm">Install on Android</h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${tenant?.primaryColor}15` }}>
                  <MoreVertical className="w-3.5 h-3.5" style={{ color: tenant?.primaryColor }} />
                </div>
                <p className="text-sm text-gray-600">Tap the <strong className="text-gray-900">⋮ menu</strong> in your browser</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${tenant?.primaryColor}15` }}>
                  <Plus className="w-3.5 h-3.5" style={{ color: tenant?.primaryColor }} />
                </div>
                <p className="text-sm text-gray-600">Tap <strong className="text-gray-900">Install App</strong> or <strong className="text-gray-900">Add to Home Screen</strong></p>
              </li>
            </ol>
          </div>
        )}

        <div className="rounded-xl border bg-white p-5 text-center space-y-3 shadow-sm">
          <h3 className="font-semibold text-gray-900 text-sm">Share with Others</h3>
          <p className="text-xs text-gray-500">Scan to open the school portal on your phone</p>
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
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
