import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Palette, Globe, Image } from 'lucide-react';

export function BrandingSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Platform Identity
          </CardTitle>
          <CardDescription>
            Configure the platform name, domain, and public-facing identity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input defaultValue="Our School Tech" />
            </div>
            <div className="space-y-2">
              <Label>Domain</Label>
              <Input defaultValue="ourschooltech.in" />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input type="email" defaultValue="support@ourschooltech.in" />
            </div>
            <div className="space-y-2">
              <Label>Support Phone</Label>
              <Input placeholder="+91 XXXXX XXXXX" />
            </div>
          </div>
          <Button>Save Identity</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Theme & Colors
          </CardTitle>
          <CardDescription>
            Customize the platform's look and feel across all schools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input defaultValue="#0F766E" className="flex-1" />
                <div className="w-10 h-10 rounded-md border bg-primary shrink-0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="flex gap-2">
                <Input defaultValue="#E69500" className="flex-1" />
                <div className="w-10 h-10 rounded-md border bg-accent shrink-0" />
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Font Family</Label>
            <Input defaultValue="Inter, Plus Jakarta Sans" disabled />
            <p className="text-xs text-muted-foreground">Font customization coming soon.</p>
          </div>
          <Button>Save Theme</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            Logo & Favicon
          </CardTitle>
          <CardDescription>
            Upload platform branding assets used across the app.
          </CardDescription>
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
          <Button>Upload & Save</Button>
        </CardContent>
      </Card>
    </div>
  );
}
