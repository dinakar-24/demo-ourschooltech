import { useTenant } from '@/contexts/TenantContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';
import { Smartphone, Share, Plus, MoreVertical, CheckCircle2, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const BASE_DOMAIN = 'ourschooltech.com';

export default function PublicInstallPage() {
  const { tenant, isSubdomain } = useTenant();
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();

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

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center p-4"
      style={{
        background: tenant?.primaryColor
          ? `linear-gradient(160deg, ${tenant.primaryColor}15 0%, ${tenant.primaryColor}05 40%, ${tenant.backgroundColor || '#ffffff'} 60%)`
          : undefined,
      }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* School branding */}
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

        {/* Already installed */}
        {isInstalled && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium text-emerald-700">App is already installed!</p>
          </div>
        )}

        {/* Install button */}
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

        {/* iOS instructions */}
        {isIOS && !isInstalled && (
          <div className="rounded-xl border bg-white p-5 space-y-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 text-sm">Install on iPhone / iPad</h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${tenant?.primaryColor}15` }}>
                  <Share className="w-3.5 h-3.5" style={{ color: tenant?.primaryColor }} />
                </div>
                <p className="text-sm text-gray-600">
                  Tap the <strong className="text-gray-900">Share</strong> button in Safari
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${tenant?.primaryColor}15` }}>
                  <Plus className="w-3.5 h-3.5" style={{ color: tenant?.primaryColor }} />
                </div>
                <p className="text-sm text-gray-600">
                  Tap <strong className="text-gray-900">Add to Home Screen</strong>
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${tenant?.primaryColor}15` }}>
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: tenant?.primaryColor }} />
                </div>
                <p className="text-sm text-gray-600">
                  Tap <strong className="text-gray-900">Add</strong> to install
                </p>
              </li>
            </ol>
          </div>
        )}

        {/* Android fallback instructions */}
        {!canInstall && !isIOS && !isInstalled && (
          <div className="rounded-xl border bg-white p-5 space-y-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 text-sm">Install on Android</h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${tenant?.primaryColor}15` }}>
                  <MoreVertical className="w-3.5 h-3.5" style={{ color: tenant?.primaryColor }} />
                </div>
                <p className="text-sm text-gray-600">
                  Tap the <strong className="text-gray-900">⋮ menu</strong> in your browser
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${tenant?.primaryColor}15` }}>
                  <Plus className="w-3.5 h-3.5" style={{ color: tenant?.primaryColor }} />
                </div>
                <p className="text-sm text-gray-600">
                  Tap <strong className="text-gray-900">Install App</strong> or <strong className="text-gray-900">Add to Home Screen</strong>
                </p>
              </li>
            </ol>
          </div>
        )}

        {/* QR Code */}
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

        {/* Back to login */}
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
