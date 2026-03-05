import { useTenant } from '@/contexts/TenantContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Download, CheckCircle, Smartphone, Wifi, Bell, Zap, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function getPlatform() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

interface SchoolData {
  name: string;
  logo: string | null;
  subdomain: string;
  appDisplayName: string | null;
  appShortName: string | null;
  primaryColor: string | null;
  backgroundColor: string | null;
}

function InstallButton({ triggerInstall, appName, platform }: { triggerInstall: () => Promise<boolean>; appName: string; platform: string }) {
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleClick = async () => {
    setInstalling(true);
    setFailed(false);
    const success = await triggerInstall();
    setInstalling(false);
    if (success) {
      setInstalled(true);
    } else {
      setFailed(true);
    }
  };

  if (installed) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-lg">
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm font-medium">App installed successfully!</span>
      </div>
    );
  }

  // iOS doesn't support beforeinstallprompt - show Safari instructions
  if (platform === 'ios') {
    return (
      <div className="w-full space-y-3 text-center">
        <p className="text-sm text-muted-foreground">To install on iPhone/iPad:</p>
        <div className="text-left space-y-2 px-4">
          <p className="text-sm"><span className="font-semibold">1.</span> Tap the <span className="font-semibold">Share</span> button <span className="inline-block w-5 h-5 align-middle text-center border border-border rounded text-xs leading-5">↑</span></p>
          <p className="text-sm"><span className="font-semibold">2.</span> Scroll down and tap <span className="font-semibold">"Add to Home Screen"</span></p>
        </div>
      </div>
    );
  }

  // Android — show manual fallback after failed attempt
  if (failed) {
    return (
      <div className="w-full space-y-3">
        <Button size="lg" onClick={handleClick} disabled={installing} className="gap-2 w-full text-base">
          <Download className="w-5 h-5" />
          Try Again
        </Button>
        <div className="text-center space-y-1.5">
          <p className="text-sm text-muted-foreground">Or install manually:</p>
          <div className="text-left space-y-1.5 px-4">
            <p className="text-sm"><span className="font-semibold">1.</span> Tap <span className="font-semibold">⋮</span> (browser menu at top right)</p>
            <p className="text-sm"><span className="font-semibold">2.</span> Tap <span className="font-semibold">"Install app"</span> or <span className="font-semibold">"Add to Home Screen"</span></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Button size="lg" onClick={handleClick} disabled={installing} className="gap-2 w-full text-base">
        {installing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Preparing...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Install {appName}
          </>
        )}
      </Button>
    </div>
  );
}

export default function PublicInstallPage() {
  const { tenant, isSubdomain } = useTenant();
  const { isInstalled, triggerInstall } = useInstallPrompt();
  const platform = getPlatform();
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract subdomain from current hostname to fetch school branding
  useEffect(() => {
    const fetchSchoolBySubdomain = async () => {
      // If tenant context already has data, use it
      if (isSubdomain && tenant) {
        setSchoolData({
          name: tenant.name,
          logo: tenant.logo || null,
          subdomain: tenant.subdomain,
          appDisplayName: tenant.appDisplayName || null,
          appShortName: tenant.appShortName || null,
          primaryColor: tenant.primaryColor || null,
          backgroundColor: tenant.backgroundColor || null,
        });
        setLoading(false);
        return;
      }

      // Try to extract subdomain from hostname
      const hostname = window.location.hostname;
      const match = hostname.match(/^([a-z0-9-]+)\.ourschooltech\.com$/i);
      const sub = match?.[1];
      
      if (sub) {
        const { data } = await supabase
          .from('schools')
          .select('name, logo, subdomain, app_display_name, app_short_name, primary_color, background_color')
          .eq('subdomain', sub)
          .eq('is_active', true)
          .single();

        if (data) {
          setSchoolData({
            name: data.name,
            logo: data.logo,
            subdomain: data.subdomain,
            appDisplayName: data.app_display_name,
            appShortName: data.app_short_name,
            primaryColor: data.primary_color,
            backgroundColor: data.background_color,
          });
        }
      }
      setLoading(false);
    };

    fetchSchoolBySubdomain();
  }, [tenant, isSubdomain]);

  // Inject a simple synchronous manifest immediately so browser can fire beforeinstallprompt
  useEffect(() => {
    if (!schoolData) return;

    const manifest = {
      id: `/${schoolData.subdomain}/app`,
      name: schoolData.appDisplayName || schoolData.name,
      short_name: schoolData.appShortName || schoolData.subdomain?.toUpperCase() || 'App',
      description: `${schoolData.appDisplayName || schoolData.name} School Portal`,
      theme_color: schoolData.primaryColor || '#0F766E',
      background_color: schoolData.backgroundColor || '#ffffff',
      display: 'standalone',
      display_override: ['standalone', 'minimal-ui'],
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      icons: schoolData.logo
        ? [
            { src: schoolData.logo, sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: schoolData.logo, sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: schoolData.logo, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          ]
        : [
            { src: '/favicon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/favicon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          ],
      categories: ['education'],
    };

    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const existing = document.querySelector('link[rel="manifest"]');
    if (existing) existing.remove();

    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = url;
    document.head.appendChild(link);

    return () => URL.revokeObjectURL(url);
  }, [schoolData]);

  const logo = schoolData?.logo || null;
  const appName = schoolData?.appDisplayName || schoolData?.name || 'School App';
  const subUpper = schoolData?.subdomain?.toUpperCase() || '';

  const features = [
    { icon: Zap, label: 'Fast & Lightweight', desc: 'Loads instantly, works like a native app' },
    { icon: Wifi, label: 'Works Offline', desc: 'Access key features without internet' },
    { icon: Bell, label: 'Push Notifications', desc: 'Get real-time alerts for attendance, fees & more' },
    { icon: Smartphone, label: 'Home Screen Access', desc: 'Launch directly from your phone' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold text-foreground">{subUpper || appName}</h1>
                <p className="text-sm text-muted-foreground mt-1">Install the app for the best experience</p>
              </div>

              {isInstalled ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-lg">
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
                  <InstallButton triggerInstall={triggerInstall} appName={subUpper || appName} platform={platform} />
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
            ← Sign in to your account
          </Link>
        </div>
      </div>
    </div>
  );
}
