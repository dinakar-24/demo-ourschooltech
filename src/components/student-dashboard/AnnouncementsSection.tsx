import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { TFunction } from 'i18next';

interface AnnouncementsSectionProps {
  announcements: any[];
  announcementsLoading: boolean;
  t: TFunction;
}

export function AnnouncementsSection({ announcements, announcementsLoading, t }: AnnouncementsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          {t('dashboard.announcements')}
        </h3>
        <Link to="/student/announcements" className="text-xs text-primary font-semibold hover:underline">
          {t('common.viewAll')}
        </Link>
      </div>
      <div className="space-y-2.5">
        {announcementsLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-4">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))
        ) : announcements.length === 0 ? (
          <div className="rounded-2xl border bg-card p-6 text-center">
            <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">{t('dashboard.noAnnouncements')}</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground">{ann.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ann.content}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-2 font-medium">
                    {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
