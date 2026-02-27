import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { LoginShapes } from './LoginShapes';
import appLogo from '@/assets/logo.png';

interface LoginSplashProps {
  onComplete: () => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 200 } },
};

export function LoginSplash({ onComplete }: LoginSplashProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="min-h-[100dvh] flex flex-col relative bg-gradient-to-br from-[hsl(230,60%,52%)] via-[hsl(220,65%,45%)] to-[hsl(200,70%,35%)]"
      onClick={onComplete}
    >
      <LoginShapes />

      <motion.div
        className="flex-1 flex flex-col items-center justify-center px-6 relative z-10"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Welcome badge */}
        <motion.div variants={item}>
          <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[hsl(0,72%,55%)] to-[hsl(15,80%,52%)] text-white px-9 py-3.5 rounded-full font-bold text-base shadow-xl">
            <span className="text-xl">❤️</span>
            WELCOME
          </div>
        </motion.div>

        {/* Brand */}
        <motion.div variants={item} className="mt-7 flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/25 mb-4 overflow-hidden">
            <img src={appLogo} alt="Our School Tech" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="text-4xl font-display font-extrabold text-white tracking-tight">Our School Tech</h1>
          <p className="text-white/60 text-sm mt-2 max-w-[260px]">
            Smart School Management for Modern Education
          </p>
        </motion.div>

        {/* Feature tags */}
        <motion.div variants={item} className="mt-5 flex flex-wrap justify-center gap-2">
          {['📊 Attendance', '💰 Fees', '📝 Results', '📚 Homework', '👨‍👩‍👧 Parents'].map((f) => (
            <span
              key={f}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.08] text-white/75 border border-white/[0.12] backdrop-blur-sm"
            >
              {f}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom wave */}
      <div className="relative z-10">
        <svg viewBox="0 0 400 50" className="w-full -mb-1 text-white" preserveAspectRatio="none">
          <path d="M0 50 L0 30 Q60 0, 140 18 Q220 36, 300 14 Q360 0, 400 16 L400 50 Z" fill="currentColor" />
        </svg>
        <div className="bg-white px-6 pb-6 pt-4 safe-area-bottom" />
      </div>
    </div>
  );
}
