import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Calendar,
} from 'lucide-react';

const mockAttendance = {
  overall: 94.5,
  thisMonth: { present: 18, absent: 1, late: 1, total: 20 },
  history: [
    { date: '2024-01-20', status: 'present' },
    { date: '2024-01-19', status: 'present' },
    { date: '2024-01-18', status: 'absent' },
    { date: '2024-01-17', status: 'present' },
    { date: '2024-01-16', status: 'late' },
    { date: '2024-01-15', status: 'present' },
    { date: '2024-01-14', status: 'present' },
    { date: '2024-01-13', status: 'present' },
    { date: '2024-01-12', status: 'present' },
    { date: '2024-01-11', status: 'present' },
  ],
};

export default function StudentAttendance() {
  const { user } = useAuth();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'late':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-success text-success-foreground">Present</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'late':
        return <Badge className="bg-warning text-warning-foreground">Late</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <MobileLayout title="My Attendance" showBack>
      <div className="p-4 space-y-4">
        {/* Overall Stats */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/70 text-sm">Overall Attendance</p>
                <p className="text-3xl font-bold mt-1">{mockAttendance.overall}%</p>
                <div className="flex items-center gap-1 mt-1 text-sm text-primary-foreground/80">
                  <TrendingUp className="w-4 h-4" />
                  <span>Keep it up!</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Calendar className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Month Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">January 2024</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xl font-bold text-foreground">{mockAttendance.thisMonth.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <p className="text-xl font-bold text-success">{mockAttendance.thisMonth.present}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10">
                <p className="text-xl font-bold text-destructive">{mockAttendance.thisMonth.absent}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
              <div className="p-3 rounded-lg bg-warning/10">
                <p className="text-xl font-bold text-warning">{mockAttendance.thisMonth.late}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent History */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent Attendance
          </h3>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {mockAttendance.history.map((record, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="font-medium text-sm">
                        {new Date(record.date).toLocaleDateString('en-IN', { 
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(record.status)}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}
