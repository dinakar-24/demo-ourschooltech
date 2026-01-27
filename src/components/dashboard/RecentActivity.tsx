import { cn } from '@/lib/utils';
import { 
  UserPlus, 
  CreditCard, 
  ClipboardCheck, 
  Bell,
  FileText,
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'student_added' | 'fee_paid' | 'attendance' | 'announcement' | 'homework';
  title: string;
  description: string;
  time: string;
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'fee_paid',
    title: 'Fee Payment Received',
    description: 'Arjun Sharma (Class 10-A) paid ₹15,000',
    time: '2 min ago',
  },
  {
    id: '2',
    type: 'student_added',
    title: 'New Admission',
    description: 'Priya Patel enrolled in Class 8-B',
    time: '15 min ago',
  },
  {
    id: '3',
    type: 'attendance',
    title: 'Attendance Marked',
    description: 'Class 9-A attendance marked by Mrs. Sharma',
    time: '30 min ago',
  },
  {
    id: '4',
    type: 'announcement',
    title: 'Announcement Posted',
    description: 'Parent-Teacher Meeting on 25th Jan',
    time: '1 hour ago',
  },
  {
    id: '5',
    type: 'homework',
    title: 'Homework Assigned',
    description: 'Mathematics homework for Class 10',
    time: '2 hours ago',
  },
];

const iconMap = {
  student_added: UserPlus,
  fee_paid: CreditCard,
  attendance: ClipboardCheck,
  announcement: Bell,
  homework: FileText,
};

const colorMap = {
  student_added: 'bg-info-muted text-info',
  fee_paid: 'bg-success-muted text-success',
  attendance: 'bg-primary-muted text-primary',
  announcement: 'bg-warning-muted text-warning',
  homework: 'bg-accent-muted text-accent',
};

export function RecentActivity() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
        <button className="text-sm text-primary hover:underline">View all</button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = iconMap[activity.type];
          return (
            <div key={activity.id} className="flex items-start gap-3 animate-fade-up">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                colorMap[activity.type]
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
