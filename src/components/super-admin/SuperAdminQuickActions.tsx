import { Link } from 'react-router-dom';
import {
  School,
  Users,
  Shield,
  Bell,
  CreditCard,
  FileText,
  Settings,
  BarChart3,
} from 'lucide-react';

const quickActions = [
  { label: 'Schools', href: '/super-admin/schools', icon: School, color: 'from-teal-500 to-teal-600' },
  { label: 'Admins', href: '/super-admin/admins', icon: Users, color: 'from-blue-500 to-blue-600' },
  { label: 'Platform Users', href: '/super-admin/platform-users', icon: Shield, color: 'from-purple-500 to-purple-600' },
  { label: 'Subscriptions', href: '/super-admin/subscriptions', icon: CreditCard, color: 'from-amber-500 to-amber-600' },
  { label: 'Notices', href: '/super-admin/announcements', icon: Bell, color: 'from-rose-500 to-rose-600' },
  { label: 'Reports', href: '/super-admin/reports', icon: BarChart3, color: 'from-indigo-500 to-indigo-600' },
  { label: 'Audit Logs', href: '/super-admin/audit-logs', icon: FileText, color: 'from-emerald-500 to-emerald-600' },
  { label: 'Settings', href: '/super-admin/settings', icon: Settings, color: 'from-slate-500 to-slate-600' },
];

export function SuperAdminQuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
      {quickActions.map((action) => (
        <Link
          key={action.href}
          to={action.href}
          className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-card border border-border/40 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95 group"
        >
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
            <action.icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground text-center leading-tight group-hover:text-foreground transition-colors">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
