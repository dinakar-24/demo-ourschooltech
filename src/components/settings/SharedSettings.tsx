import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Globe, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
];

export function SharedSettings() {
  const { t, i18n } = useTranslation();
  const { isSubscribed, isSupported, subscribe, permission } = usePushNotifications();
  const { theme, setTheme } = useTheme();

  const handleNotificationToggle = async (checked: boolean) => {
    if (checked) {
      if (!isSupported) {
        toast.error(t('settingsPage.notificationsNotSupported'));
        return;
      }
      const success = await subscribe();
      if (success) {
        toast.success(t('settingsPage.notificationsEnabled'));
      } else if (permission === 'denied') {
        toast.error(t('settingsPage.notificationsBlocked'));
      }
    } else {
      toast.info(t('settingsPage.disableNotifications'));
    }
  };

  const handleLanguageChange = (val: string) => {
    i18n.changeLanguage(val);
    localStorage.setItem('app-language', val);
    const langLabel = LANGUAGES.find(l => l.code === val)?.label || val;
    toast.success(t('settingsPage.languageSet', { language: langLabel }));
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0 divide-y divide-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <Label htmlFor="notifications" className="font-medium cursor-pointer">
                {t('settingsPage.pushNotifications')}
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
              <Label htmlFor="darkmode" className="font-medium cursor-pointer">
                {t('settingsPage.darkMode')}
              </Label>
            </div>
            <Switch
              id="darkmode"
              checked={isDark}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <p className="font-medium text-sm">{t('settingsPage.language')}</p>
            </div>
            <Select value={i18n.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>{lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-center text-muted-foreground">
        {t('settingsPage.appVersion')} 1.0.0
      </p>
    </div>
  );
}
