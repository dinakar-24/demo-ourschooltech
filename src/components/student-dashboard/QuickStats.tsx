import { motion } from 'framer-motion';
import { CheckCircle, BookOpen, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { TFunction } from 'i18next';

interface QuickStatsProps {
  attendance: number;
  attendanceLoading: boolean;
  pendingHomework: number;
  homeworkLoading: boolean;
  t: TFunction;
}

export function QuickStats({ attendance, attendanceLoading, pendingHomework, homeworkLoading, t }: QuickStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
      className="grid grid-cols-3 gap-3"
    >
      <Link to="/student/attendance" className="rounded-2xl border bg-card p-3.5 text-center hover:shadow-md transition-all active:scale-[0.97] group">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-emerald-500/15 transition-colors">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
        </div>
        {attendanceLoading ? (
          <Skeleton className="h-7 w-12 mx-auto mb-1" />
        ) : (
          <p className="text-2xl font-bold text-foreground">{attendance}%</p>
        )}
        <p className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-wide">{t('dashboard.attendance')}</p>
      </Link>
      
      <Link to="/student/homework" className="rounded-2xl border bg-card p-3.5 text-center hover:shadow-md transition-all active:scale-[0.97] group">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-amber-500/15 transition-colors">
          <BookOpen className="w-5 h-5 text-amber-500" />
        </div>
        {homeworkLoading ? (
          <Skeleton className="h-7 w-8 mx-auto mb-1" />
        ) : (
          <p className="text-2xl font-bold text-foreground">{pendingHomework}</p>
        )}
        <p className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-wide">{t('dashboard.pendingHW')}</p>
      </Link>
      
      <Link to="/student/results" className="rounded-2xl border bg-card p-3.5 text-center hover:shadow-md transition-all active:scale-[0.97] group">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-violet-500/15 transition-colors">
          <Award className="w-5 h-5 text-violet-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">A+</p>
        <p className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-wide">{t('dashboard.lastGrade')}</p>
      </Link>
    </motion.div>
  );
}
