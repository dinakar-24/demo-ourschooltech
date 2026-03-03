import { useEffect } from 'react';
import { motion } from 'framer-motion';
import appLogo from '@/assets/logo.png';

interface LoginSplashProps {
  onComplete: () => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 200 } },
};

export function LoginSplash({ onComplete }: LoginSplashProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500); // Reduced from 4s
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-[100dvh] flex flex-col relative bg-gradient-to-br from-[hsl(230,60%,52%)] via-[hsl(220,65%,45%)] to-[hsl(200,70%,35%)]">
      {/* Simplified background — single orb instead of LoginShapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, hsl(200 60% 60% / 0.4), transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-[300px] h-[300px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(260 50% 50% / 0.3), transparent 70%)' }}
        />
      </div>

      {/* Main content */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center px-6 relative z-10"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Simplified illustration — lightweight SVG */}
        <motion.div variants={item} className="mb-6">
          <svg width="200" height="140" viewBox="0 0 200 140" fill="none" className="mx-auto">
            {/* Simple graduation scene */}
            <rect x="40" y="80" width="120" height="30" rx="10" fill="hsl(220 10% 82% / 0.5)" />
            {/* Male figure */}
            <circle cx="75" cy="50" r="12" fill="hsl(200 55% 58% / 0.7)" />
            <rect x="67" y="62" width="16" height="28" rx="4" fill="hsl(210 25% 88% / 0.6)" />
            <rect x="60" y="38" width="30" height="6" rx="2" fill="hsl(220 55% 42% / 0.7)" />
            {/* Female figure */}
            <circle cx="125" cy="50" r="12" fill="hsl(200 50% 52% / 0.7)" />
            <rect x="117" y="62" width="16" height="28" rx="4" fill="hsl(222 48% 28% / 0.6)" />
            <rect x="110" y="38" width="30" height="6" rx="2" fill="hsl(220 55% 42% / 0.7)" />
            {/* A+ badge */}
            <circle cx="160" cy="35" r="14" fill="hsl(45 85% 55% / 0.5)" />
            <text x="160" y="39" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">A+</text>
          </svg>
        </motion.div>

        {/* Welcome badge */}
        <motion.div variants={item}>
          <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[hsl(0,72%,55%)] to-[hsl(15,80%,52%)] text-white px-8 py-3 rounded-full font-bold text-base shadow-xl">
            <span className="text-xl">❤️</span>
            WELCOME
          </div>
        </motion.div>

        {/* Brand */}
        <motion.div variants={item} className="mt-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/25 mb-4 overflow-hidden">
            <img src={appLogo} alt="Our School Tech" className="w-16 h-16 object-contain" loading="eager" fetchPriority="high" decoding="sync" />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">Our School Tech</h1>
          <p className="text-white/50 text-sm mt-2 max-w-[260px]">
            Smart School Management for Modern Education
          </p>
        </motion.div>

        {/* Feature tags */}
        <motion.div variants={item} className="mt-5 flex flex-wrap justify-center gap-2">
          {['📊 Attendance', '💰 Fees', '📝 Results', '📚 Homework', '👨‍👩‍👧 Parents'].map((f) => (
            <span
              key={f}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.08] text-white/75 border border-white/[0.12]"
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
