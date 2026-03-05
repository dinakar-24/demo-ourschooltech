import { useTenant } from '@/contexts/TenantContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { QRCodeSVG } from 'qrcode.react';
import { Download, CheckCircle, Smartphone, Wifi, Bell, Zap, Share, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

function getPlatform() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

export function InstallAppPage() {
  const { tenant } = useTenant();
  const { isInstalled, triggerInstall, hasPrompt } = useInstallPrompt();
  const platform = getPlatform();

  const schoolUrl = tenant
    ? `https://${tenant.code.toLowerCase()}.ourschooltech.com`
    : window.location.origin;

  const appName = tenant?.appDisplayName || tenant?.name || 'School App';

  const features = [
    { icon: Zap, label: 'Fast & Lightweight', desc: 'Loads instantly, works like a native app' },
    { icon: Wifi, label: 'Works Offline', desc: 'Access key features without internet' },
    { icon: Bell, label: 'Push Notifications', desc: 'Get real-time alerts for attendance, fees & more' },
    { icon: Smartphone, label: 'Home Screen Access', desc: 'Launch directly from your phone' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with branding */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            {tenant?.logo ? (
              <img src={tenant.logo} alt={appName} className="w-20 h-20 rounded-2xl object-contain bg-muted p-2" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center">
                <Download className="w-10 h-10 text-primary-foreground" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-foreground">{appName}</h2>
              <p className="text-sm text-muted-foreground mt-1">Install the app for the best experience</p>
            </div>

            {isInstalled ? (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-success/10 text-success rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">App is installed!</span>
              </div>
            ) : hasPrompt ? (
              <Button size="lg" onClick={triggerInstall} className="gap-2">
                <Download className="w-5 h-5" />
                Install App
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <h3 className="text-base font-semibold text-foreground">Scan to Install on Mobile</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Scan this QR code with any phone camera to open the app and install it
            </p>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-border">
              <QRCodeSVG
                value={schoolUrl}
                size={180}
                level="H"
                includeMargin={false}
                imageSettings={tenant?.logo ? {
                  src: tenant.logo,
                  height: 36,
                  width: 36,
                  excavate: true,
                } : undefined}
              />
            </div>
            <p className="text-xs text-muted-foreground font-mono">{schoolUrl}</p>
          </div>
        </CardContent>
      </Card>

      {/* Platform-specific instructions */}
      {!isInstalled && (
        <Card>
          <CardContent className="pt-6">
            {platform === 'ios' ? (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">Install on iPhone / iPad</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                    <div>
                      <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        Tap the <Share className="w-4 h-4 inline text-primary" /> Share button
                      </p>
                      <p className="text-xs text-muted-foreground">Found at the bottom of Safari</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                    <div>
                      <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        Tap <PlusSquare className="w-4 h-4 inline text-primary" /> "Add to Home Screen"
                      </p>
                      <p className="text-xs text-muted-foreground">Scroll down in the share menu to find it</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Tap "Add" to confirm</p>
                      <p className="text-xs text-muted-foreground">The app icon will appear on your home screen</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : platform === 'android' ? (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">Install on Android</h3>
                {hasPrompt ? (
                  <p className="text-sm text-muted-foreground">
                    Tap the <strong>"Install App"</strong> button above to add it to your home screen.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Open in Chrome browser</p>
                        <p className="text-xs text-muted-foreground">This works best in Google Chrome</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Tap the ⋮ menu → "Install app"</p>
                        <p className="text-xs text-muted-foreground">Or look for the install banner at the bottom</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-foreground">Install on Desktop</h3>
                <p className="text-sm text-muted-foreground">
                  Look for the install icon in your browser's address bar, or use the button above.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feature highlights */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Why Install?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
