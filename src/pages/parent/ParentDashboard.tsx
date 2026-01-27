import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ClipboardList, 
  CreditCard, 
  Award,
  Bell,
  ChevronRight,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ParentDashboard() {
  const { user } = useAuth();

  const childInfo = {
    name: user?.childName || 'Arjun Verma',
    class: user?.className || 'Class 8',
    section: user?.section || 'A',
    rollNo: 15,
    attendance: 94.5,
    pendingFees: 12500,
  };

  const recentUpdates = [
    { type: 'result', title: 'Math Test Result', detail: 'Scored 85/100', time: '2 hours ago', icon: Award },
    { type: 'homework', title: 'Science Homework', detail: 'Due tomorrow', time: '5 hours ago', icon: ClipboardList },
    { type: 'announcement', title: 'PTM Notice', detail: 'Scheduled for 25th Jan', time: '1 day ago', icon: Bell },
  ];

  return (
    <MobileLayout>
      <div className="p-4 space-y-5">
        {/* Child Profile Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                {childInfo.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-xl font-bold">{childInfo.name}</h2>
                <p className="text-primary-foreground/80">
                  {childInfo.class} - {childInfo.section} | Roll No. {childInfo.rollNo}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/parent/attendance">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{childInfo.attendance}%</p>
                <p className="text-sm text-muted-foreground">Attendance</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/parent/fees">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-warning" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">₹{(childInfo.pendingFees / 1000).toFixed(1)}K</p>
                <p className="text-sm text-muted-foreground">Pending Fees</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Attendance', icon: ClipboardList, href: '/parent/attendance', color: 'text-primary' },
            { label: 'Fees', icon: CreditCard, href: '/parent/fees', color: 'text-warning' },
            { label: 'Results', icon: Award, href: '/parent/results', color: 'text-success' },
            { label: 'Notices', icon: Bell, href: '/parent/announcements', color: 'text-info' },
          ].map((action) => (
            <Link key={action.label} to={action.href}>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors">
                <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{action.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Fee Alert */}
        {childInfo.pendingFees > 0 && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium text-foreground">Fee Payment Due</p>
                  <p className="text-sm text-muted-foreground">₹{childInfo.pendingFees.toLocaleString()} pending</p>
                </div>
              </div>
              <Link to="/parent/fees">
                <button className="px-4 py-2 bg-warning text-warning-foreground rounded-lg text-sm font-medium">
                  Pay Now
                </button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Recent Updates */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent Updates
          </h3>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {recentUpdates.map((update, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <update.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{update.title}</p>
                      <p className="text-sm text-muted-foreground">{update.detail}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{update.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Attendance Calendar Preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              This Month
            </h3>
            <Link to="/parent/attendance" className="text-sm text-primary font-medium">
              View Details
            </Link>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">18</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-destructive">1</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">1</p>
                    <p className="text-xs text-muted-foreground">Late</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-success">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">94.5%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}
