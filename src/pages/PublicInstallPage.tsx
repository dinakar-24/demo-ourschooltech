import { useTenant } from '@/contexts/TenantContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { QRCodeSVG } from 'qrcode.react';
import { Download, CheckCircle, Smartphone, Wifi, Bell, Zap, Share, PlusSquare, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

function getPlatform() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

export default function PublicInstallPage() {
  const { tenant } = useTenant();
  const { isInstalled, triggerInstall, hasPrompt } = useInstallPrompt();
  const platform = getPlatform();

  const logo = tenant?.logo || null;
  const appName = tenant?.appDisplayName || tenant?.name || 'School App';
  const subdomain = tenant?.subdomain;
  const schoolUrl = subdomain
    ? `https://${subdomain}.ourschooltech.com`
    : window.location.origin;

  const features = [
    { icon: Zap, label: 'Fast & Lightweight', desc: 'Loads instantly, works like a native app' },
    { icon: Wifi, label: 'Works Offline', desc: 'Access key features without internet' },
    { icon: Bell, label: 'Push Notifications', desc: 'Get real-time alerts for attendance, fees & more' },
    { icon: Smartphone, label: 'Home Screen Access', desc: 'Launch directly from your phone' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">
        {/* Header with branding */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center gap-4">
              {logo ? (
                <img src={logo} alt={appName} className="w-24 h-24 rounded-2xl object-contain bg-muted p-2 shadow-sm" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center shadow-md">
                  <Download className="w-12 h-12 text-primary-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">{appName}</h1>
                <p className="text-sm text-muted-foreground mt-1">Install the app for the best experience</p>
              </div>

              {isInstalled ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-success/10 text-success rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">App is installed!</span>
                  </div>
                  <Link to="/">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      Open App
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                  {hasPrompt && (
                    <Button size="lg" onClick={triggerInstall} className="gap-2 w-full text-base">
                      <Download className="w-5 h-5" />
                      Install {appName}
                    </Button>
                  )}
                  {platform === 'ios' && !hasPrompt && (
                    <div className="space-y-3 w-full">
                      <div className="flex items-start gap-3 text-left">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                        <p className="text-sm text-foreground">
                          Tap the <Share className="w-4 h-4 inline text-primary" /> <strong>Share</strong> button in Safari
                        </p>
                      </div>
                      <div className="flex items-start gap-3 text-left">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                        <p className="text-sm text-foreground">
                          Tap <PlusSquare className="w-4 h-4 inline text-primary" /> <strong>Add to Home Screen</strong>
                        </p>
                      </div>
                      <div className="flex items-start gap-3 text-left">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
                        <p className="text-sm text-foreground">Tap <strong>Add</strong> to confirm</p>
                      </div>
                    </div>
                  )}
                  {platform === 'android' && !hasPrompt && (
                    <div className="space-y-3 w-full">
                      <div className="flex items-start gap-3 text-left">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                        <p className="text-sm text-foreground">Open this page in <strong>Chrome</strong></p>
                      </div>
                      <div className="flex items-start gap-3 text-left">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                        <p className="text-sm text-foreground">Tap <strong>⋮ menu</strong> → <strong>Install app</strong></p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feature highlights */}
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Why Install?</h3>
            <div className="grid grid-cols-2 gap-3">
              {features.map((f) => (
                <div key={f.label} className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground leading-tight">{f.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Link to login */}
        <div className="text-center">
          <Link to="/" className="text-sm text-primary hover:underline font-medium">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
