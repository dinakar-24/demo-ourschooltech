import { Link } from 'react-router-dom';
import { 
  UserPlus, 
  ClipboardCheck, 
  CreditCard, 
  FileText, 
  Bell,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const quickActions = [
  { label: 'Add Student', href: '/students/add', icon: UserPlus, variant: 'accent' as const },
  { label: 'Mark Attendance', href: '/attendance/mark', icon: ClipboardCheck, variant: 'default' as const },
  { label: 'Collect Fee', href: '/fees/collect', icon: CreditCard, variant: 'default' as const },
  { label: 'Post Homework', href: '/homework/new', icon: FileText, variant: 'default' as const },
  { label: 'Send Notice', href: '/announcements/new', icon: Bell, variant: 'default' as const },
  { label: 'Download Report', href: '/reports', icon: Download, variant: 'outline' as const },
];

export function QuickActions() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickActions.map((action) => (
          <Link key={action.href} to={action.href}>
            <Button 
              variant={action.variant} 
              className="w-full h-auto py-3 flex-col gap-2"
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
