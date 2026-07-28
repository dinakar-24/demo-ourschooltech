import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { TFunction } from 'i18next';

interface WelcomeCardProps {
  student: any;
  studentInfo: { name: string; class: string; section: string; rollNo: string | number };
  studentLoading: boolean;
  user: any;
  t: TFunction;
}

export function WelcomeCard({ student, studentInfo, studentLoading, user, t }: WelcomeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 text-primary-foreground shadow-lg relative overflow-hidden"
    >
      {/* Decorative circles */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 -left-4 w-20 h-20 rounded-full bg-white/5" />

      {studentLoading ? (
        <div className="flex items-center gap-4 relative z-10">
          <Skeleton className="w-16 h-16 rounded-2xl bg-white/20" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-14 bg-white/20" />
            <Skeleton className="h-5 w-28 bg-white/20" />
            <Skeleton className="h-3 w-16 bg-white/20" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold overflow-hidden ring-2 ring-white/25 shrink-0">
            {(student?.avatar_url || user?.avatar) ? (
              <img src={student?.avatar_url || user?.avatar} alt={studentInfo.name} className="w-full h-full object-cover" loading="lazy" width={64} height={64} />
            ) : (
              <span className="text-primary-foreground/90 text-lg">{studentInfo.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-primary-foreground/60 text-xs font-medium tracking-wide uppercase">{t('dashboard.hello')}</p>
            <h2 className="text-xl font-bold truncate mt-0.5">{studentInfo.name}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-primary-foreground/95 backdrop-blur-sm">
                {studentInfo.class} - {studentInfo.section}
              </span>
              {studentInfo.rollNo !== '-' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-primary-foreground/70">
                  Roll #{studentInfo.rollNo}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
