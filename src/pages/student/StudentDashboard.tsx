import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BookOpen, Award, Bell, CheckCircle, AlertCircle, Calendar, 
  ImageIcon, Bus, Video, MessageSquare, HelpCircle, Star,
  ChevronRight, Clock, Megaphone,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStudentProfile, useStudentAttendanceStats, useStudentHomework } from '@/hooks/useStudentData';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const quickActions = [
  { label: 'Attendance', icon: CheckCircle, href: '/student/attendance', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { label: 'Results', icon: Award, href: '/student/results', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
  { label: 'Timetable', icon: Calendar, href: '/student/timetable', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  { label: 'Subjects', icon: BookOpen, href: '/student/subjects', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  { label: 'Gallery', icon: ImageIcon, href: '/student/gallery', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950/30' },
  { label: 'Transport', icon: Bus, href: '/student/transport', color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
  { label: 'Online Class', icon: Video, href: '/student/online-classes', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  { label: 'Notices', icon: Megaphone, href: '/student/announcements', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
];

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
      <div className="p-4 space-y-5 pb-6">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-4 text-primary-foreground shadow-lg"
        >
          {studentLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-full bg-white/20" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-14 bg-white/20" />
                <Skeleton className="h-5 w-28 bg-white/20" />
                <Skeleton className="h-3 w-16 bg-white/20" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold overflow-hidden ring-2 ring-white/30 shrink-0">
                {(student?.avatar_url || user?.avatar) ? (
                  <img src={student?.avatar_url || user?.avatar} alt={studentInfo.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary-foreground/90">{studentInfo.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-primary-foreground/60 text-xs font-medium">{t('dashboard.hello')}</p>
                <h2 className="text-lg font-bold truncate">{studentInfo.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/15 text-primary-foreground/90">
                    {studentInfo.class} - {studentInfo.section}
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {!student && !studentLoading && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-3.5 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-warning shrink-0" />
            <div>
              <p className="font-medium text-sm text-foreground">{t('dashboard.profileNotLinked')}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.contactAdmin')}</p>
            </div>
          </div>
        )}

        {/* Quick Stats - 3 column */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="grid grid-cols-3 gap-3"
        >
          <Link to="/student/attendance" className="rounded-xl border bg-card p-3 text-center hover:shadow-md transition-shadow active:scale-[0.97]">
            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            {attendanceLoading ? (
              <Skeleton className="h-6 w-12 mx-auto mb-1" />
            ) : (
              <p className="text-xl font-bold text-foreground">{attendance}%</p>
            )}
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t('dashboard.attendance')}</p>
          </Link>
          
          <Link to="/student/homework" className="rounded-xl border bg-card p-3 text-center hover:shadow-md transition-shadow active:scale-[0.97]">
            <BookOpen className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
            {homeworkLoading ? (
              <Skeleton className="h-6 w-8 mx-auto mb-1" />
            ) : (
              <p className="text-xl font-bold text-foreground">{pendingHomework}</p>
            )}
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t('dashboard.pendingHW')}</p>
          </Link>
          
          <Link to="/student/results" className="rounded-xl border bg-card p-3 text-center hover:shadow-md transition-shadow active:scale-[0.97]">
            <Award className="w-6 h-6 text-violet-500 mx-auto mb-1.5" />
            <p className="text-xl font-bold text-foreground">A+</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t('dashboard.lastGrade')}</p>
          </Link>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Access
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                to={action.href}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl hover:bg-muted/50 transition-colors active:scale-[0.95]"
              >
                <div className={`w-11 h-11 rounded-xl ${action.bg} flex items-center justify-center`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-[10px] font-medium text-foreground/80 text-center leading-tight">{action.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Timetable Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('dashboard.timetable')}
          </h3>
          <Link to="/student/timetable" className="block">
            <div className="rounded-xl border bg-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow active:scale-[0.98]">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{t('dashboard.viewTimetable')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {student ? `${student.class_name} - ${student.section}` : t('dashboard.viewClassSchedule')}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          </Link>
        </motion.div>

        {/* Pending Homework */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('dashboard.pendingHomework')}
            </h3>
            <Link to="/student/homework" className="text-xs text-primary font-semibold hover:underline">
              {t('common.viewAll')}
            </Link>
          </div>
          <div className="space-y-2.5">
            {homeworkLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-3.5">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))
            ) : homework?.length === 0 ? (
              <div className="rounded-xl border bg-card p-5 text-center">
                <p className="text-muted-foreground text-sm">{t('dashboard.noPendingHomework')}</p>
              </div>
            ) : (
              homework?.slice(0, 3).map((hw) => (
                <div key={hw.id} className="rounded-xl border bg-card p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{hw.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">{hw.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] text-amber-600 font-semibold whitespace-nowrap">
                      {format(new Date(hw.due_date), 'dd MMM')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('dashboard.announcements')}
            </h3>
            <Link to="/student/announcements" className="text-xs text-primary font-semibold hover:underline">
              {t('common.viewAll')}
            </Link>
          </div>
          <div className="space-y-2.5">
            {announcementsLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))
            ) : announcements.length === 0 ? (
              <div className="rounded-xl border bg-card p-5 text-center">
                <p className="text-muted-foreground text-sm">{t('dashboard.noAnnouncements')}</p>
              </div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground">{ann.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ann.content}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                        {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
