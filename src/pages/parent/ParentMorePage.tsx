import { MobileLayout } from '@/components/layout/MobileLayout';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Bell,
  Image,
  Bus,
  MessageCircle,
  Video,
  MessageSquare,
  HelpCircle,
  Settings,
  User,
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ParentMorePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const menuSections = [
    {
      title: t('parent.more.academics'),
      items: [
        { label: t('nav.fees'), icon: CreditCard, href: '/parent/fees', color: 'text-warning' },
        { label: t('sidebar.onlineClasses'), icon: Video, href: '/parent/online-classes', color: 'text-primary' },
      ],
    },
    {
      title: t('parent.more.schoolLife'),
      items: [
        { label: t('nav.announcements'), icon: Bell, href: '/parent/announcements', color: 'text-info' },
        { label: t('sidebar.gallery'), icon: Image, href: '/parent/gallery', color: 'text-accent-foreground' },
        { label: t('sidebar.transport'), icon: Bus, href: '/parent/transport', color: 'text-success' },
        { label: t('sidebar.messages'), icon: MessageCircle, href: '/parent/messages', color: 'text-primary' },
      ],
    },
    {
      title: t('parent.more.support'),
      items: [
        { label: t('sidebar.feedback'), icon: MessageSquare, href: '/parent/feedback', color: 'text-warning' },
        { label: t('parent.profile.helpSupport'), icon: HelpCircle, href: '/parent/queries', color: 'text-destructive' },
      ],
    },
    {
      title: t('parent.more.account'),
      items: [
        { label: t('sidebar.profile'), icon: User, href: '/parent/profile', color: 'text-foreground' },
        { label: t('sidebar.settings'), icon: Settings, href: '/parent/settings', color: 'text-muted-foreground' },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <MobileLayout title={t('nav.more')}>
      <div className="p-4 space-y-5 pb-8">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h3>
            <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-card rounded-xl border border-border hover:bg-destructive/5 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
            <LogOut className="w-4.5 h-4.5" />
          </div>
          <span className="text-sm font-medium text-destructive">{t('common.signOut')}</span>
        </button>
      </div>
    </MobileLayout>
  );
}
