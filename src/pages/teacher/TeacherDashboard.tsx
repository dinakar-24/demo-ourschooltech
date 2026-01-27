import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ClipboardList, 
  BookOpen, 
  FileText, 
  Bell,
  Users,
  ChevronRight,
  Calendar,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  const { user, school } = useAuth();

  const quickActions = [
    { label: 'Mark Attendance', icon: ClipboardList, href: '/teacher/attendance', color: 'bg-primary' },
    { label: 'Post Homework', icon: BookOpen, href: '/teacher/homework', color: 'bg-accent' },
    { label: 'Enter Marks', icon: FileText, href: '/teacher/marks', color: 'bg-success' },
    { label: 'Announcements', icon: Bell, href: '/teacher/announcements', color: 'bg-info' },
  ];

  const todayClasses = [
    { class: 'Class 8-A', subject: 'Mathematics', time: '9:00 AM', status: 'completed' },
    { class: 'Class 9-B', subject: 'Mathematics', time: '10:30 AM', status: 'ongoing' },
    { class: 'Class 10-A', subject: 'Physics', time: '12:00 PM', status: 'upcoming' },
    { class: 'Class 7-C', subject: 'Mathematics', time: '2:30 PM', status: 'upcoming' },
  ];

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/70 text-sm">Welcome back,</p>
                <h2 className="text-xl font-bold mt-1">{user?.name}</h2>
                <p className="text-sm text-primary-foreground/80 mt-0.5">
                  {user?.subjects?.join(', ')}
                </p>
              </div>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                {user?.name?.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">4 Classes Today</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">156 Students</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Today's Schedule
            </h3>
            <Link to="/teacher/timetable" className="text-sm text-primary font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {todayClasses.map((cls, i) => (
              <Card key={i} className={cls.status === 'ongoing' ? 'border-primary bg-primary/5' : ''}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      cls.status === 'completed' ? 'bg-success/10 text-success' :
                      cls.status === 'ongoing' ? 'bg-primary/10 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{cls.class}</p>
                      <p className="text-sm text-muted-foreground">{cls.subject}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{cls.time}</p>
                    <p className={`text-xs capitalize ${
                      cls.status === 'completed' ? 'text-success' :
                      cls.status === 'ongoing' ? 'text-primary' :
                      'text-muted-foreground'
                    }`}>
                      {cls.status}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pending Tasks */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Pending Tasks
          </h3>
          <Card>
            <CardContent className="divide-y divide-border">
              <Link to="/teacher/attendance" className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-warning" />
                  </div>
                  <span className="text-sm font-medium">Mark attendance for Class 9-B</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
              <Link to="/teacher/homework" className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-info" />
                  </div>
                  <span className="text-sm font-medium">Review 12 homework submissions</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}
