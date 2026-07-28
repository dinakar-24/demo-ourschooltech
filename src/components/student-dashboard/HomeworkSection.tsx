import { motion } from 'framer-motion';
import { BookOpen, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { TFunction } from 'i18next';

interface HomeworkSectionProps {
  homework: any[] | undefined;
  homeworkLoading: boolean;
  t: TFunction;
}

export function HomeworkSection({ homework, homeworkLoading, t }: HomeworkSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          {t('dashboard.pendingHomework')}
        </h3>
        <Link to="/student/homework" className="text-xs text-primary font-semibold hover:underline">
          {t('common.viewAll')}
        </Link>
      </div>
      <div className="space-y-2.5">
        {homeworkLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-3.5">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))
        ) : homework?.length === 0 ? (
          <div className="rounded-2xl border bg-card p-6 text-center">
            <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">{t('dashboard.noPendingHomework')}</p>
          </div>
        ) : (
          homework?.slice(0, 3).map((hw) => (
            <div key={hw.id} className="rounded-2xl border bg-card p-3.5 flex items-center justify-between gap-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{hw.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{hw.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 bg-amber-500/10 px-2.5 py-1 rounded-full">
                <Clock className="w-3 h-3 text-amber-600" />
                <span className="text-[10px] text-amber-700 font-semibold whitespace-nowrap">
                  {format(new Date(hw.due_date), 'dd MMM')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
