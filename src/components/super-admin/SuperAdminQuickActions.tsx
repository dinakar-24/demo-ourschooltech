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
  { label: 'Schools', href: '/super-admin/schools', icon: School, color: 'bg-teal-500' },
  { label: 'Admins', href: '/super-admin/admins', icon: Users, color: 'bg-blue-500' },
  { label: 'School Users', href: '/super-admin/users', icon: Shield, color: 'bg-purple-500' },
  { label: 'Subscriptions', href: '/super-admin/subscriptions', icon: CreditCard, color: 'bg-amber-500' },
  { label: 'Notices', href: '/super-admin/announcements', icon: Bell, color: 'bg-rose-500' },
  { label: 'Reports', href: '/super-admin/reports', icon: BarChart3, color: 'bg-indigo-500' },
  { label: 'Audit Logs', href: '/super-admin/audit-logs', icon: FileText, color: 'bg-emerald-500' },
  { label: 'Settings', href: '/super-admin/settings', icon: Settings, color: 'bg-slate-500' },
];

export function SuperAdminQuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {quickActions.map((action) => (
        <Link
          key={action.href}
          to={action.href}
          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all active:scale-95"
        >
          <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center shadow-sm`}>
            <action.icon className="w-5 h-5 text-white" />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
