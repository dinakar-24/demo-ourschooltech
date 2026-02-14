import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BookOpen,
  Award,
  Bell,
  CheckCircle,
  AlertCircle,
  Calendar,
  ImageIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStudentProfile, useStudentAttendanceStats, useStudentHomework } from '@/hooks/useStudentData';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: student, isLoading: studentLoading } = useStudentProfile();
  const { data: attendanceStats, isLoading: attendanceLoading } = useStudentAttendanceStats(student?.id);
  const { data: homework, isLoading: homeworkLoading } = useStudentHomework(student?.class_name, student?.section);
  const { data: announcementsData, isLoading: announcementsLoading } = useAnnouncements({ status: 'active', pageSize: 3 });

  const studentInfo = student ? {
    name: student.full_name,
    class: student.class_name,
    section: student.section,
    rollNo: student.roll_number || '-',
  } : {
    name: user?.name || t('common.student'),
    class: 'N/A',
    section: 'N/A',
    rollNo: '-',
  };

  const attendance = attendanceStats?.percentage || 0;
  const pendingHomework = homework?.length || 0;
  const announcements = announcementsData?.data || [];

  return (
    <MobileLayout>
      <div className="p-4 space-y-5">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <CardContent className="p-5">
            {studentLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-full bg-white/20" />
                <div>
                  <Skeleton className="h-4 w-16 mb-2 bg-white/20" />
                  <Skeleton className="h-6 w-32 mb-1 bg-white/20" />
                  <Skeleton className="h-4 w-24 bg-white/20" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold overflow-hidden">
                  {(student?.avatar_url || user?.avatar) ? (
                    <img src={student?.avatar_url || user?.avatar} alt={studentInfo.name} className="w-full h-full object-cover" />
                  ) : (
                    studentInfo.name.split(' ').map(n => n[0]).join('')
                  )}
                </div>
                <div>
                  <p className="text-primary-foreground/70 text-sm">{t('dashboard.hello')}</p>
                  <h2 className="text-xl font-bold">{studentInfo.name}</h2>
                  <p className="text-sm text-primary-foreground/80">
                    {studentInfo.class} - {studentInfo.section}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!student && !studentLoading && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning" />
              <div>
                <p className="font-medium text-foreground">{t('dashboard.profileNotLinked')}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.contactAdmin')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Link to="/student/attendance">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 text-center">
                <CheckCircle className="w-6 h-6 text-success mx-auto mb-1" />
                {attendanceLoading ? (
                  <Skeleton className="h-6 w-12 mx-auto mb-1" />
                ) : (
                  <p className="text-lg font-bold">{attendance}%</p>
                )}
                <p className="text-xs text-muted-foreground">{t('dashboard.attendance')}</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/student/homework">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 text-center">
                <BookOpen className="w-6 h-6 text-warning mx-auto mb-1" />
                {homeworkLoading ? (
                  <Skeleton className="h-6 w-8 mx-auto mb-1" />
                ) : (
                  <p className="text-lg font-bold">{pendingHomework}</p>
                )}
                <p className="text-xs text-muted-foreground">{t('dashboard.pendingHW')}</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/student/results">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 text-center">
                <Award className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">A+</p>
                <p className="text-xs text-muted-foreground">{t('dashboard.lastGrade')}</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Timetable Link */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t('dashboard.timetable')}
            </h3>
          </div>
          <Link to="/student/timetable">
            <Card className="hover:shadow-md transition-shadow border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{t('dashboard.viewTimetable')}</p>
                  <p className="text-xs text-muted-foreground">
                    {student ? `${student.class_name} - ${student.section}` : t('dashboard.viewClassSchedule')}
                  </p>
                </div>
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Pending Homework */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t('dashboard.pendingHomework')}
            </h3>
            <Link to="/student/homework" className="text-sm text-primary font-medium">
              {t('common.viewAll')}
            </Link>
          </div>
          <div className="space-y-2">
            {homeworkLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))
            ) : homework?.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  {t('dashboard.noPendingHomework')}
                </CardContent>
              </Card>
            ) : (
              homework?.slice(0, 3).map((hw) => (
                <Card key={hw.id}>
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
                    <span className="text-xs text-warning font-medium">
                      {t('dashboard.due')} {format(new Date(hw.due_date), 'dd MMM')}
                    </span>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Announcements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t('dashboard.announcements')}
            </h3>
            <Link to="/student/announcements" className="text-sm text-primary font-medium">
              {t('common.viewAll')}
            </Link>
          </div>
          <div className="space-y-2">
            {announcementsLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4" />
                  </CardContent>
                </Card>
              ))
            ) : announcements.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                  {t('dashboard.noAnnouncements')}
                </CardContent>
              </Card>
            ) : (
              announcements.map((ann) => (
                <Card key={ann.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-info" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{ann.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {ann.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
