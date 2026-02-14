import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Bell, Moon, Globe } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

export default function StudentSettings() {
  const { isSubscribed, isSupported, subscribe, permission } = usePushNotifications();
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Restore theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  }, []);

  const handleNotificationToggle = async (checked: boolean) => {
    if (checked) {
      if (!isSupported) {
        toast.error('Push notifications are not supported on this device');
        return;
      }
      const success = await subscribe();
      if (success) {
        toast.success('Push notifications enabled!');
      } else if (permission === 'denied') {
        toast.error('Notifications blocked. Please enable them in your browser settings.');
      }
    } else {
      toast.info('To disable notifications, update your browser notification settings.');
    }
  };

  return (
    <MobileLayout title="App Settings" showBack>
      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <Label htmlFor="notifications" className="font-medium cursor-pointer">
                  Push Notifications
                </Label>
              </div>
              <Switch
                id="notifications"
                checked={isSubscribed}
                onCheckedChange={handleNotificationToggle}
                disabled={!isSupported}
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-muted-foreground" />
                <Label htmlFor="darkMode" className="font-medium cursor-pointer">
                  Dark Mode
                </Label>
              </div>
              <Switch
                id="darkMode"
                checked={darkMode}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Language</p>
                  <p className="text-xs text-muted-foreground">English</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          App Version 1.0.0
        </p>
      </div>
    </MobileLayout>
  );
}
