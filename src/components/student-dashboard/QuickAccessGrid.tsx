import { motion } from 'framer-motion';
import { CheckCircle, Award, Calendar, ClipboardList, ImageIcon, Bus, Video, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';

const quickActions = [
  { label: 'Attendance', icon: CheckCircle, href: '/student/attendance', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  { label: 'Results', icon: Award, href: '/student/results', color: 'text-violet-600', bg: 'bg-violet-500/10' },
  { label: 'Timetable', icon: Calendar, href: '/student/timetable', color: 'text-blue-600', bg: 'bg-blue-500/10' },
  { label: 'Homework', icon: ClipboardList, href: '/student/homework', color: 'text-amber-600', bg: 'bg-amber-500/10' },
  { label: 'Gallery', icon: ImageIcon, href: '/student/gallery', color: 'text-pink-600', bg: 'bg-pink-500/10' },
  { label: 'Transport', icon: Bus, href: '/student/transport', color: 'text-cyan-600', bg: 'bg-cyan-500/10' },
  { label: 'Online Class', icon: Video, href: '/student/online-classes', color: 'text-red-600', bg: 'bg-red-500/10' },
  { label: 'Notices', icon: Megaphone, href: '/student/announcements', color: 'text-orange-600', bg: 'bg-orange-500/10' },
];

export function QuickAccessGrid() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
    >
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        Quick Access
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            to={action.href}
            className="flex flex-col items-center gap-2 py-3.5 rounded-2xl hover:bg-muted/60 transition-all active:scale-[0.93]"
          >
            <div className={`w-12 h-12 rounded-2xl ${action.bg} flex items-center justify-center transition-transform`}>
              <action.icon className={`w-5.5 h-5.5 ${action.color}`} />
            </div>
            <span className="text-[10px] font-semibold text-foreground/75 text-center leading-tight">{action.label}</span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
