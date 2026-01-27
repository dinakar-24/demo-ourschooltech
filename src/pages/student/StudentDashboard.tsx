import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ClipboardList, 
  BookOpen,
  Award,
  Bell,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();

  const studentInfo = {
    name: user?.name || 'Arjun Verma',
    class: user?.className || 'Class 8',
    section: user?.section || 'A',
    rollNo: 15,
    attendance: 94.5,
  };

  const todaySchedule = [
    { subject: 'Mathematics', time: '9:00 - 9:45', teacher: 'Mrs. Sharma', status: 'completed' },
    { subject: 'Science', time: '10:00 - 10:45', teacher: 'Mr. Gupta', status: 'completed' },
    { subject: 'English', time: '11:00 - 11:45', teacher: 'Ms. Patel', status: 'ongoing' },
    { subject: 'Hindi', time: '12:00 - 12:45', teacher: 'Mrs. Verma', status: 'upcoming' },
  ];

  const pendingHomework = [
    { subject: 'Mathematics', title: 'Chapter 5 Exercise', due: 'Tomorrow' },
    { subject: 'Science', title: 'Lab Report', due: 'In 2 days' },
  ];

  return (
    <MobileLayout>
      <div className="p-4 space-y-5">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                {studentInfo.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-primary-foreground/70 text-sm">Hello,</p>
                <h2 className="text-xl font-bold">{studentInfo.name}</h2>
                <p className="text-sm text-primary-foreground/80">
                  {studentInfo.class} - {studentInfo.section}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Link to="/student/attendance">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 text-center">
                <CheckCircle className="w-6 h-6 text-success mx-auto mb-1" />
                <p className="text-lg font-bold">{studentInfo.attendance}%</p>
                <p className="text-xs text-muted-foreground">Attendance</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/student/homework">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 text-center">
                <BookOpen className="w-6 h-6 text-warning mx-auto mb-1" />
                <p className="text-lg font-bold">2</p>
                <p className="text-xs text-muted-foreground">Pending HW</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/student/results">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 text-center">
                <Award className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">A+</p>
                <p className="text-xs text-muted-foreground">Last Grade</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Today's Schedule */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Today's Classes
            </h3>
            <Link to="/student/timetable" className="text-sm text-primary font-medium">
              Full Timetable
            </Link>
          </div>
          <div className="space-y-2">
            {todaySchedule.map((cls, i) => (
              <Card key={i} className={cls.status === 'ongoing' ? 'border-primary bg-primary/5' : ''}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      cls.status === 'completed' ? 'bg-success/10 text-success' :
                      cls.status === 'ongoing' ? 'bg-primary text-primary-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {cls.subject.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cls.subject}</p>
                      <p className="text-xs text-muted-foreground">{cls.teacher}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{cls.time}</p>
                    {cls.status === 'ongoing' && (
                      <span className="text-xs text-primary font-medium">Now</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pending Homework */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Homework
            </h3>
            <Link to="/student/homework" className="text-sm text-primary font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {pendingHomework.map((hw, i) => (
              <Card key={i}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{hw.subject}</p>
                      <p className="text-xs text-muted-foreground">{hw.title}</p>
                    </div>
                  </div>
                  <span className="text-xs text-warning font-medium">{hw.due}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Announcements
            </h3>
            <Link to="/student/announcements" className="text-sm text-primary font-medium">
              View All
            </Link>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-info" />
                </div>
                <div>
                  <p className="font-medium text-sm">Annual Sports Day</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sports Day will be held on 28th January. All students must participate.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Posted 2 hours ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}
