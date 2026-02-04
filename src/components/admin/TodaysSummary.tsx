import { ClipboardCheck, CreditCard, UserPlus, Bell } from 'lucide-react';

const todayItems = [
  { 
    label: 'Attendance Marked', 
    value: '12/15 classes', 
    icon: ClipboardCheck,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  { 
    label: 'Fees Collected', 
    value: '₹45,000', 
    icon: CreditCard,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  { 
    label: 'New Admissions', 
    value: '3 students', 
    icon: UserPlus,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  { 
    label: 'Notices Sent', 
    value: '2 announcements', 
    icon: Bell,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10'
  },
];

export function TodaysSummary() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-3">Today's Activity</h3>
      <div className="space-y-3">
        {todayItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
