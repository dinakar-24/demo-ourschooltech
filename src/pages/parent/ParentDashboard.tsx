import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ClipboardList, 
  CreditCard, 
  Award,
  Bell,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Image,
  Bus,
  MessageCircle,
  Video,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useParentChild, useChildAttendanceStats, useChildFeeStats } from '@/hooks/useParentData';
import { Skeleton } from '@/components/ui/skeleton';

export default function ParentDashboard() {
  const { user } = useAuth();
  const { data: child, isLoading: childLoading } = useParentChild();
  const { data: attendanceStats, isLoading: attendanceLoading } = useChildAttendanceStats(child?.id);
  const { data: feeStats, isLoading: feeLoading } = useChildFeeStats(child?.id);

  const isLoading = childLoading || attendanceLoading || feeLoading;

  const childInfo = child ? {
    name: child.full_name,
    class: child.class_name,
    section: child.section,
    rollNo: child.roll_number || '-',
  } : {
    name: user?.name || 'No child linked',
    class: 'N/A',
    section: 'N/A',
    rollNo: '-',
  };

  const attendance = attendanceStats?.percentage || 0;
  const pendingFees = feeStats?.pending || 0;

  const quickActions = [
    { label: 'Attendance', icon: ClipboardList, href: '/parent/attendance', color: 'text-primary' },
    { label: 'Fees', icon: CreditCard, href: '/parent/fees', color: 'text-warning' },
    { label: 'Results', icon: Award, href: '/parent/results', color: 'text-success' },
    { label: 'Notices', icon: Bell, href: '/parent/announcements', color: 'text-info' },
    { label: 'Homework', icon: BookOpen, href: '/parent/homework', color: 'text-warning' },
    { label: 'Gallery', icon: Image, href: '/parent/gallery', color: 'text-accent-foreground' },
    { label: 'Transport', icon: Bus, href: '/parent/transport', color: 'text-success' },
    { label: 'Classes', icon: Video, href: '/parent/online-classes', color: 'text-primary' },
    { label: 'Messages', icon: MessageCircle, href: '/parent/messages', color: 'text-primary' },
    { label: 'Feedback', icon: MessageSquare, href: '/parent/feedback', color: 'text-warning' },
    { label: 'Queries', icon: HelpCircle, href: '/parent/queries', color: 'text-destructive' },
  ];

  return (
    <MobileLayout>
      <div className="p-4 space-y-5">
        {/* Child Profile Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <CardContent className="p-5">
            {childLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full bg-white/20" />
                <div>
                  <Skeleton className="h-6 w-32 mb-2 bg-white/20" />
                  <Skeleton className="h-4 w-40 bg-white/20" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold overflow-hidden">
                  {(child?.avatar_url || user?.avatar) ? (
                    <img src={child?.avatar_url || user?.avatar} alt={childInfo.name} className="w-full h-full object-cover" />
                  ) : (
                    childInfo.name.split(' ').map(n => n[0]).join('')
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{childInfo.name}</h2>
                  <p className="text-primary-foreground/80">
                    {childInfo.class} - {childInfo.section} | Roll No. {childInfo.rollNo}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!child && !childLoading && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning" />
              <div>
                <p className="font-medium text-foreground">No Child Linked</p>
                <p className="text-sm text-muted-foreground">
                  Contact your school admin to link your child's account.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{attendance}%</p>
                )}
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
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    ₹{pendingFees > 1000 ? `${(pendingFees / 1000).toFixed(1)}K` : pendingFees}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">Pending Fees</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions - Full grid */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.href}>
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors">
                  <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${action.color}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Fee Alert */}
        {pendingFees > 0 && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium text-foreground">Fee Payment Due</p>
                  <p className="text-sm text-muted-foreground">₹{pendingFees.toLocaleString()} pending</p>
                </div>
              </div>
              <Link to="/parent/fees">
                <button className="px-4 py-2 bg-warning text-warning-foreground rounded-lg text-sm font-medium">
                  View
                </button>
              </Link>
            </CardContent>
          </Card>
        )}

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
                  {isLoading ? (
                    <>
                      <Skeleton className="h-10 w-10" />
                      <Skeleton className="h-10 w-10" />
                      <Skeleton className="h-10 w-10" />
                    </>
                  ) : (
                    <>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-success">{attendanceStats?.present || 0}</p>
                        <p className="text-xs text-muted-foreground">Present</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-destructive">{attendanceStats?.absent || 0}</p>
                        <p className="text-xs text-muted-foreground">Absent</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-warning">{attendanceStats?.late || 0}</p>
                        <p className="text-xs text-muted-foreground">Late</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 text-success">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">{attendance}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}
