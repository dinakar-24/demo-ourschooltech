import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { LoginShapes } from './LoginShapes';
import appLogo from '@/assets/logo.png';
import { GraduationCap, Users, CreditCard, BookOpen, Bell } from 'lucide-react';

interface LoginSplashProps {
  onComplete: () => void;
  onSuperAdmin: () => void;
}

const features = [
  { icon: GraduationCap, label: 'Attendance' },
  { icon: CreditCard, label: 'Fees' },
  { icon: BookOpen, label: 'Results' },
  { icon: Users, label: 'Parents' },
  { icon: Bell, label: 'Updates' },
];

export function LoginSplash({ onComplete, onSuperAdmin }: LoginSplashProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, hsl(230, 65%, 28%) 0%, hsl(220, 60%, 22%) 40%, hsl(210, 55%, 18%) 100%)' }}
    >
      <LoginShapes />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Logo */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        >
          <div className="w-28 h-28 rounded-3xl bg-white/[0.08] backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/[0.12]">
            <img src={appLogo} alt="Our School Tech" className="w-22 h-22 object-contain" />
          </div>
        </motion.div>

        {/* Brand text */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', damping: 22 }}
        >
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Our School Tech
          </h1>
          <p className="text-white/40 text-base">
            Smart School Management
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-2.5 max-w-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08, type: 'spring', damping: 20 }}
            >
              <f.icon className="w-3.5 h-3.5 text-white/50" />
              <span className="text-xs font-medium text-white/60">{f.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom section */}
      <motion.div
        className="relative z-10 px-6 pb-8 pt-4 safe-area-bottom flex flex-col items-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', damping: 22 }}
      >
        {/* Progress bar */}
        <div className="w-full max-w-xs h-1 rounded-full bg-white/[0.08] overflow-hidden mb-5">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, hsl(200, 80%, 55%), hsl(220, 70%, 60%))' }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 4, ease: 'linear' }}
          />
        </div>
        <p className="text-white/20 text-xs mb-3">Preparing your workspace...</p>
        <button
          onClick={onSuperAdmin}
          className="text-white/15 hover:text-white/40 text-[11px] transition-colors"
        >
          System Administration
        </button>
      </motion.div>
    </div>
  );
}
