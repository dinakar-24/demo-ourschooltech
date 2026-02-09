import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { IndianPhoneInput } from '@/components/ui/indian-phone-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Palette, Globe, Image, Loader2 } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const BRANDING_FALLBACK = { platform_name: 'Our School Tech', domain: 'ourschooltech.in', support_email: 'support@ourschooltech.in', support_phone: '' };
const THEME_FALLBACK = { primary_color: '#0F766E', accent_color: '#E69500' };

export function BrandingSettings() {
  const { getSetting, updateSetting, isLoading } = useSystemSettings();

  const [branding, setBranding] = useState(BRANDING_FALLBACK);
  const [theme, setTheme] = useState(THEME_FALLBACK);

  useEffect(() => {
    if (!isLoading) {
      setBranding(getSetting('branding', BRANDING_FALLBACK));
      setTheme(getSetting('theme', THEME_FALLBACK));
    }
  }, [isLoading]);

  const saving = updateSetting.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Platform Identity
          </CardTitle>
          <CardDescription>Configure the platform name, domain, and public-facing identity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input value={branding.platform_name} onChange={(e) => setBranding(s => ({ ...s, platform_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Domain</Label>
              <Input value={branding.domain} onChange={(e) => setBranding(s => ({ ...s, domain: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input type="email" value={branding.support_email} onChange={(e) => setBranding(s => ({ ...s, support_email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Support Phone</Label>
              <IndianPhoneInput value={branding.support_phone} onChange={(v) => setBranding(s => ({ ...s, support_phone: v }))} />
            </div>
          </div>
          <Button disabled={saving} onClick={() => updateSetting.mutate({ key: 'branding', value: branding })}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Identity
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Theme & Colors
          </CardTitle>
          <CardDescription>Customize the platform's look and feel across all schools.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input value={theme.primary_color} onChange={(e) => setTheme(s => ({ ...s, primary_color: e.target.value }))} className="flex-1" />
                <div className="w-10 h-10 rounded-md border shrink-0" style={{ backgroundColor: theme.primary_color }} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="flex gap-2">
                <Input value={theme.accent_color} onChange={(e) => setTheme(s => ({ ...s, accent_color: e.target.value }))} className="flex-1" />
                <div className="w-10 h-10 rounded-md border shrink-0" style={{ backgroundColor: theme.accent_color }} />
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Font Family</Label>
            <Input defaultValue="Inter, Plus Jakarta Sans" disabled />
            <p className="text-xs text-muted-foreground">Font customization coming soon.</p>
          </div>
          <Button disabled={saving} onClick={() => updateSetting.mutate({ key: 'theme', value: theme })}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Theme
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            Logo & Favicon
          </CardTitle>
          <CardDescription>Upload platform branding assets used across the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Platform Logo</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drop your logo here or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, SVG • Max 2MB • Recommended: 200×60px</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Favicon</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drop your favicon here or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, ICO • Max 500KB • 32×32px or 64×64px</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">File upload functionality coming soon. Logos are currently managed per-school.</p>
        </CardContent>
      </Card>
    </div>
  );
}
