import { MobileLayout } from '@/components/layout/MobileLayout';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Clock,
  Users,
  Video,
  MessageCircle,
  MessageSquare,
  HelpCircle,
  Settings,
  User,
  LogOut,
  Image,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TeacherMorePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuSections = [
    {
      title: t('teacher.more.classroom', 'Classroom'),
      items: [
        { label: t('nav.students', 'Students'), icon: Users, href: '/teacher/students', color: 'text-primary' },
        { label: t('nav.timetable', 'Timetable'), icon: Clock, href: '/teacher/timetable', color: 'text-info' },
        { label: t('nav.onlineClasses', 'Online Classes'), icon: Video, href: '/teacher/online-classes', color: 'text-success' },
      ],
    },
    {
      title: t('teacher.more.communication', 'Communication'),
      items: [
        { label: t('nav.announcements', 'Announcements'), icon: Bell, href: '/teacher/announcements', color: 'text-warning' },
        { label: t('nav.messages', 'Messages'), icon: MessageCircle, href: '/teacher/messages', color: 'text-primary' },
      ],
    },
    {
      title: t('teacher.more.support', 'Support'),
      items: [
        { label: t('nav.feedback', 'Feedback'), icon: MessageSquare, href: '/teacher/feedback', color: 'text-warning' },
        { label: t('nav.queries', 'Help & Queries'), icon: HelpCircle, href: '/teacher/queries', color: 'text-destructive' },
      ],
    },
    {
      title: t('teacher.more.account', 'Account'),
      items: [
        { label: t('nav.profile', 'Profile'), icon: User, href: '/teacher/profile', color: 'text-foreground' },
        { label: t('nav.settings', 'Settings'), icon: Settings, href: '/teacher/settings', color: 'text-muted-foreground' },
      ],
    },
  ];

  return (
    <MobileLayout title={t('nav.more', 'More')}>
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

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-card rounded-xl border border-border hover:bg-destructive/5 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
            <LogOut className="w-4.5 h-4.5" />
          </div>
          <span className="text-sm font-medium text-destructive">{t('auth.logout', 'Logout')}</span>
        </button>
      </div>
    </MobileLayout>
  );
}
