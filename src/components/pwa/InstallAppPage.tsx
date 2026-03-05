import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useDynamicManifest } from '@/hooks/useDynamicManifest';
import { QRCodeSVG } from 'qrcode.react';
import { Download, CheckCircle, Smartphone, Wifi, Bell, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function getPlatform() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  school_admin: 'Admin',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
};

interface SchoolBranding {
  name: string;
  logo: string | null;
  subdomain: string;
  appDisplayName: string | null;
  appShortName: string | null;
}

function InAppInstallButton({ triggerInstall, appName }: { triggerInstall: () => Promise<boolean>; appName: string }) {
  const [installing, setInstalling] = useState(false);

  const handleClick = async () => {
    setInstalling(true);
    await triggerInstall();
    setInstalling(false);
  };

  return (
    <div className="w-full">
      <Button size="lg" onClick={handleClick} disabled={installing} className="gap-2 w-full">
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

export function InstallAppPage() {
  const { tenant } = useTenant();
  const { school, user } = useAuth();
  const { isInstalled, triggerInstall } = useInstallPrompt();
  const platform = getPlatform();
  const [schoolBranding, setSchoolBranding] = useState<SchoolBranding | null>(null);

  // Ensure dynamic manifest is set for proper PWA install
  useDynamicManifest(
    user?.role === 'school_admin' ? 'admin' : user?.role,
    schoolBranding ? {
      name: schoolBranding.name,
      logo: schoolBranding.logo,
      subdomain: schoolBranding.subdomain,
      appDisplayName: schoolBranding.appDisplayName,
      appShortName: schoolBranding.appShortName,
    } : undefined
  );

  // When no tenant context (non-subdomain), fetch school details from DB
  useEffect(() => {
    if (tenant || !school?.id) return;

    const fetchSchool = async () => {
      const { data } = await supabase
        .from('schools')
        .select('name, logo, subdomain, app_display_name, app_short_name')
        .eq('id', school.id)
        .single();
      
      if (data) {
        setSchoolBranding({
          name: data.name,
          logo: data.logo,
          subdomain: data.subdomain,
          appDisplayName: data.app_display_name,
          appShortName: data.app_short_name,
        });
      }
    };
    fetchSchool();
  }, [tenant, school?.id]);

  // Resolve branding
  const isSuperAdmin = user?.role === 'super_admin';
  const logo = isSuperAdmin
    ? '/images/ost-logo.png'
    : tenant?.logo || schoolBranding?.logo || school?.logo || null;
  const subdomain = tenant?.subdomain || schoolBranding?.subdomain;
  const subUpper = subdomain?.toUpperCase() || '';
  const roleLabel = user?.role ? (roleLabels[user.role] || '') : '';
  
  // Role-specific app name: "SSE-Admin", "SSE-Parent"
  const appName = isSuperAdmin
    ? 'OST-SuperAdmin'
    : roleLabel && subUpper
      ? `${subUpper}-${roleLabel}`
      : tenant?.appDisplayName || tenant?.name || schoolBranding?.appDisplayName || schoolBranding?.name || school?.name || 'School App';

  // QR code points to the install page
  const schoolUrl = isSuperAdmin
    ? 'https://app.ourschooltech.com/install'
    : subdomain
      ? `https://${subdomain}.ourschooltech.com/install`
      : `${window.location.origin}/install`;

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
            {logo ? (
              <img src={logo} alt={appName} className="w-20 h-20 rounded-2xl object-contain bg-muted p-2" />
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
            ) : (
              <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                <InAppInstallButton triggerInstall={triggerInstall} appName={appName} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code — show only on desktop/tablet */}
      {platform === 'desktop' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <h3 className="text-base font-semibold text-foreground">Scan to Install on Mobile</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Scan this QR code with any phone camera to install the app
              </p>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-border">
                <QRCodeSVG
                  value={schoolUrl}
                  size={180}
                  level="H"
                  includeMargin={false}
                  imageSettings={logo ? {
                    src: logo,
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
