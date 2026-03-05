import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';
import { Smartphone, Share, Plus, MoreVertical, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

export default function InstallAppPage() {
  const { school } = useAuth();
  const { impersonatedSchool, isImpersonating } = useImpersonation();
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();

  const displaySchool = isImpersonating ? impersonatedSchool : school;
  const installUrl = window.location.origin;

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      toast.success('App installed successfully!');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(installUrl);
    toast.success('Link copied to clipboard');
  };

  return (
    <AdminLayout title="Install App">
      <div className="max-w-lg mx-auto space-y-6 pb-8">
        {/* School branding */}
        <div className="text-center space-y-3 pt-2">
          {displaySchool?.logo && (
            <div className="w-20 h-20 mx-auto flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={displaySchool.logo}
                alt={displaySchool.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-foreground">{displaySchool?.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">Install as a mobile app</p>
          </div>
        </div>

        {/* Already installed state */}
        {isInstalled && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              App is already installed on this device!
            </p>
          </div>
        )}

        {/* Install button (Android/Desktop) */}
        {canInstall && !isInstalled && (
          <Button onClick={handleInstall} className="w-full h-12 rounded-xl text-base font-semibold gap-2" size="lg">
            <Smartphone className="w-5 h-5" />
            Install App
          </Button>
        )}

        {/* iOS instructions */}
        {isIOS && !isInstalled && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Install on iPhone / iPad</h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Share className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Tap the <strong className="text-foreground">Share</strong> button in Safari's toolbar
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong>
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Tap <strong className="text-foreground">Add</strong> to install the app
                </p>
              </li>
            </ol>
          </div>
        )}

        {/* Android instructions (when prompt not available) */}
        {!canInstall && !isIOS && !isInstalled && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Install on Android</h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MoreVertical className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Tap the <strong className="text-foreground">⋮ menu</strong> in your browser
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Tap <strong className="text-foreground">Install App</strong> or <strong className="text-foreground">Add to Home Screen</strong>
                </p>
              </li>
            </ol>
          </div>
        )}

        {/* QR Code */}
        <div className="rounded-xl border border-border bg-card p-5 text-center space-y-3">
          <h3 className="font-semibold text-foreground text-sm">Share with Teachers & Parents</h3>
          <p className="text-xs text-muted-foreground">Scan this QR code from any phone to open the school portal</p>
          <div className="inline-block p-3 bg-white rounded-xl">
            <QRCodeSVG value={installUrl} size={160} level="M" />
          </div>
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="w-full">
            Copy Portal Link
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
