import { cn } from '@/lib/utils';

interface ClassAttendance {
  className: string;
  section: string;
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

const attendanceData: ClassAttendance[] = [
  { className: 'Class 10', section: 'A', total: 45, present: 42, absent: 3, percentage: 93 },
  { className: 'Class 10', section: 'B', total: 44, present: 40, absent: 4, percentage: 91 },
  { className: 'Class 9', section: 'A', total: 42, present: 38, absent: 4, percentage: 90 },
  { className: 'Class 9', section: 'B', total: 43, present: 41, absent: 2, percentage: 95 },
  { className: 'Class 8', section: 'A', total: 40, present: 35, absent: 5, percentage: 88 },
];

export function AttendanceOverview() {
  const todayDate = new Date().toLocaleDateString('en-IN', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'short' 
  });

  return (
    <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Today's Attendance</h3>
          <p className="text-sm text-muted-foreground">{todayDate}</p>
        </div>
        <button className="text-sm text-primary hover:underline">View details</button>
      </div>

      <div className="space-y-3">
        {attendanceData.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-20 text-sm font-medium text-foreground">
              {item.className}-{item.section}
            </div>
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    item.percentage >= 90 ? "bg-success" : 
                    item.percentage >= 80 ? "bg-warning" : "bg-destructive"
                  )}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-success font-medium">{item.present}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-destructive font-medium">{item.absent}</span>
              <span className={cn(
                "w-12 text-right font-semibold",
                item.percentage >= 90 ? "text-success" : 
                item.percentage >= 80 ? "text-warning" : "text-destructive"
              )}>
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
