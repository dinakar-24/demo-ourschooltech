import { Link } from 'react-router-dom';
import { 
  UserPlus, 
  ClipboardCheck, 
  CreditCard, 
  GraduationCap,
  Bell,
  BarChart3,
  Users,
  BookOpen,
} from 'lucide-react';

const quickActions = [
  { label: 'Students', href: '/admin/students', icon: Users, color: 'bg-blue-500' },
  { label: 'Teachers', href: '/admin/teachers', icon: GraduationCap, color: 'bg-teal-500' },
  { label: 'Attendance', href: '/admin/attendance', icon: ClipboardCheck, color: 'bg-emerald-500' },
  { label: 'Fees', href: '/admin/fees', icon: CreditCard, color: 'bg-amber-500' },
  { label: 'Classes', href: '/admin/classes', icon: BookOpen, color: 'bg-purple-500' },
  { label: 'Notices', href: '/admin/announcements', icon: Bell, color: 'bg-rose-500' },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3, color: 'bg-indigo-500' },
  { label: 'Add User', href: '/admin/students', icon: UserPlus, color: 'bg-primary' },
];

export function AdminQuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {quickActions.map((action) => (
        <Link 
          key={action.href + action.label} 
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
