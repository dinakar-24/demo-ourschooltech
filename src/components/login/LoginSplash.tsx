import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { LoginShapes } from './LoginShapes';
import appLogo from '@/assets/logo.png';
import splashIllustration from '@/assets/splash-illustration.png';

interface LoginSplashProps {
  onComplete: () => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 18, stiffness: 180 } },
};

export function LoginSplash({ onComplete }: LoginSplashProps) {
  // Auto-advance after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-[100dvh] flex flex-col relative bg-gradient-to-br from-[hsl(230,60%,52%)] via-[hsl(220,65%,45%)] to-[hsl(200,70%,35%)]">
      <LoginShapes />

      {/* Main content area */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center px-6 relative z-10"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Illustration area */}
        <motion.div variants={item} className="mb-4">
          <div className="relative w-72 h-56 mx-auto flex items-center justify-center">
            <motion.img
              src={splashIllustration}
              alt="School illustration"
              className="w-64 h-64 object-contain drop-shadow-2xl"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Floating badges */}
            <motion.div className="absolute top-0 left-[30%]" animate={{ y: [0, -10, 0], rotate: [0, 8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none"><rect width="38" height="38" rx="10" fill="hsl(200 60% 60% / 0.45)" /><path d="M11 19 L17 25 L27 13" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </motion.div>
            <motion.div className="absolute top-8 right-0" animate={{ y: [0, -6, 0], rotate: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="2" y="4" width="24" height="20" rx="3" fill="hsl(350 65% 55% / 0.4)" /><rect x="4" y="6" width="20" height="16" rx="2" fill="hsl(350 65% 55% / 0.6)" /></svg>
            </motion.div>
            <motion.div className="absolute bottom-4 right-0" animate={{ y: [0, -5, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="14" fill="hsl(45 85% 55% / 0.5)" /><text x="15" y="18" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">A+</text></svg>
            </motion.div>
          </div>
        </motion.div>

        {/* Welcome badge */}
        <motion.div variants={item}>
          <motion.div
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[hsl(0,72%,55%)] to-[hsl(15,80%,52%)] text-white px-9 py-3.5 rounded-full font-bold text-base shadow-xl shadow-[hsl(0,70%,50%)/0.3]"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-xl">❤️</span>
            WELCOME
          </motion.div>
        </motion.div>

        {/* Brand */}
        <motion.div variants={item} className="mt-7 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/25 mb-4 overflow-hidden">
            <img src={appLogo} alt="Our School Tech" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">Our School Tech</h1>
          <motion.p className="text-white/55 text-sm mt-2 max-w-[260px]" animate={{ opacity: [0.55, 0.8, 0.55] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            Smart School Management for Modern Education
          </motion.p>
        </motion.div>

        {/* Feature tags */}
        <motion.div variants={item} className="mt-5 flex flex-wrap justify-center gap-2">
          {['📊 Attendance', '💰 Fees', '📝 Results', '📚 Homework', '👨‍👩‍👧 Parents'].map((f, i) => (
            <motion.span
              key={f}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.08] text-white/75 border border-white/[0.12] backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.7, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1, type: 'spring', damping: 18 }}
            >
              {f}
            </motion.span>
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
