import { motion } from 'framer-motion';
import { School, ArrowRight } from 'lucide-react';
import { LoginShapes } from './LoginShapes';

interface LoginSplashProps {
  onGetStarted: () => void;
  onSuperAdmin: () => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 200 } },
};

export function LoginSplash({ onGetStarted, onSuperAdmin }: LoginSplashProps) {
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
        {/* Illustration area — graduates SVG */}
        <motion.div variants={item} className="mb-6">
          <div className="relative w-64 h-48 mx-auto">
            {/* Couch */}
            <motion.svg viewBox="0 0 260 100" className="absolute bottom-4 left-0 w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}>
              <rect x="40" y="30" width="180" height="50" rx="12" fill="hsl(220 10% 80%)" />
              <rect x="30" y="20" width="40" height="65" rx="10" fill="hsl(220 10% 75%)" />
              <rect x="190" y="20" width="40" height="65" rx="10" fill="hsl(220 10% 75%)" />
              <rect x="70" y="35" width="45" height="30" rx="6" fill="hsl(45 90% 60%)" />
              <circle cx="55" cy="90" r="5" fill="hsl(25 50% 40%)" />
              <circle cx="210" cy="90" r="5" fill="hsl(25 50% 40%)" />
              {/* Plants */}
              <g transform="translate(10,40)">
                <rect x="6" y="25" width="12" height="15" rx="2" fill="hsl(45 80% 55%)" />
                <ellipse cx="12" cy="22" rx="10" ry="12" fill="hsl(140 60% 50%)" />
                <ellipse cx="6" cy="26" rx="6" ry="8" fill="hsl(140 55% 45%)" />
              </g>
              <g transform="translate(225,40)">
                <rect x="2" y="25" width="12" height="15" rx="2" fill="hsl(200 70% 55%)" />
                <ellipse cx="8" cy="22" rx="10" ry="12" fill="hsl(140 60% 50%)" />
                <ellipse cx="14" cy="26" rx="6" ry="8" fill="hsl(140 55% 45%)" />
              </g>
            </motion.svg>
            {/* Male graduate */}
            <motion.svg
              viewBox="0 0 80 160"
              className="absolute bottom-0 left-[18%] w-20 h-36"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, type: 'spring', damping: 18 }}
            >
              <circle cx="40" cy="28" r="16" fill="hsl(200 60% 60%)" />
              <rect x="22" y="10" width="36" height="8" rx="2" fill="hsl(220 60% 45%)" />
              <rect x="30" y="4" width="20" height="8" rx="2" fill="hsl(220 60% 45%)" />
              <rect x="28" y="44" width="24" height="40" rx="6" fill="hsl(210 30% 85%)" />
              <rect x="24" y="48" width="10" height="30" rx="4" fill="hsl(200 60% 60%)" transform="rotate(-15 29 48)" />
              <rect x="46" y="48" width="10" height="30" rx="4" fill="hsl(200 60% 60%)" transform="rotate(15 51 48)" />
              <rect x="30" y="84" width="10" height="35" rx="4" fill="hsl(210 70% 55%)" />
              <rect x="42" y="84" width="10" height="35" rx="4" fill="hsl(210 70% 55%)" />
              {/* Sunglasses */}
              <rect x="28" y="24" width="10" height="6" rx="2" fill="hsl(0 0% 15%)" />
              <rect x="42" y="24" width="10" height="6" rx="2" fill="hsl(0 0% 15%)" />
              <line x1="38" y1="27" x2="42" y2="27" stroke="hsl(0 0% 15%)" strokeWidth="1.5" />
            </motion.svg>
            {/* Female graduate */}
            <motion.svg
              viewBox="0 0 80 160"
              className="absolute bottom-0 right-[18%] w-20 h-36"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, type: 'spring', damping: 18 }}
            >
              <circle cx="40" cy="28" r="16" fill="hsl(200 55% 55%)" />
              {/* Hair */}
              <path d="M24 28 C24 18, 30 8, 40 8 C50 8, 56 18, 56 28 C56 22, 58 35, 55 45 C52 42, 28 42, 25 45 C22 35, 24 22, 24 28Z" fill="hsl(280 40% 30%)" />
              <rect x="22" y="10" width="36" height="8" rx="2" fill="hsl(220 60% 45%)" />
              <rect x="30" y="4" width="20" height="8" rx="2" fill="hsl(220 60% 45%)" />
              {/* Jacket */}
              <rect x="28" y="44" width="24" height="40" rx="6" fill="hsl(220 50% 30%)" />
              <rect x="34" y="44" width="12" height="15" rx="2" fill="hsl(35 80% 55%)" />
              <rect x="24" y="48" width="10" height="28" rx="4" fill="hsl(200 55% 55%)" />
              <rect x="46" y="48" width="10" height="28" rx="4" fill="hsl(200 55% 55%)" />
              <rect x="30" y="84" width="10" height="35" rx="4" fill="hsl(210 70% 55%)" />
              <rect x="42" y="84" width="10" height="35" rx="4" fill="hsl(210 70% 55%)" />
              {/* Sunglasses */}
              <rect x="28" y="24" width="10" height="6" rx="2" fill="hsl(0 0% 15%)" />
              <rect x="42" y="24" width="10" height="6" rx="2" fill="hsl(0 0% 15%)" />
              <line x1="38" y1="27" x2="42" y2="27" stroke="hsl(0 0% 15%)" strokeWidth="1.5" />
              {/* Headphones */}
              <path d="M22 24 C22 14, 28 8, 40 8 C52 8, 58 14, 58 24" stroke="hsl(280 40% 35%)" strokeWidth="3" fill="none" />
              <circle cx="22" cy="26" r="4" fill="hsl(280 40% 35%)" />
              <circle cx="58" cy="26" r="4" fill="hsl(280 40% 35%)" />
              {/* Diploma in hand */}
              <rect x="50" y="60" width="4" height="18" rx="2" fill="hsl(0 0% 95%)" transform="rotate(15 52 69)" />
            </motion.svg>
            {/* Floating checkmark */}
            <motion.div
              className="absolute top-4 left-[35%]"
              animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="8" fill="hsl(200 60% 60% / 0.5)" />
                <path d="M10 18 L16 24 L26 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </div>
        </motion.div>

        {/* Welcome badge */}
        <motion.div variants={item}>
          <motion.div
            className="inline-flex items-center gap-2 bg-[hsl(0,70%,58%)] text-white px-8 py-3 rounded-full font-bold text-base shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-xl">❤️</span>
            WELCOME
          </motion.div>
        </motion.div>

        {/* Brand */}
        <motion.div variants={item} className="mt-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-xl border border-white/25 mb-4">
            <School className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">
            Our School Tech
          </h1>
          <p className="text-white/60 text-sm mt-2 max-w-[260px]">
            Smart School Management for Modern Education
          </p>
        </motion.div>

        {/* Feature tags */}
        <motion.div variants={item} className="mt-6 flex flex-wrap justify-center gap-2">
          {['📊 Attendance', '💰 Fees', '📝 Results', '📚 Homework', '👨‍👩‍👧 Parents'].map((f, i) => (
            <motion.span
              key={f}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white/80 border border-white/15 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              {f}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom CTA area — curved top edge */}
      <div className="relative z-10">
        {/* Curved wave divider */}
        <svg viewBox="0 0 400 40" className="w-full -mb-1 text-white" preserveAspectRatio="none">
          <path d="M0 40 L0 20 Q100 0, 200 20 Q300 40, 400 20 L400 40 Z" fill="currentColor" />
        </svg>
        <motion.div
          className="bg-white px-6 pb-8 pt-4 safe-area-bottom"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, type: 'spring', damping: 22 }}
        >
          <motion.button
            onClick={onGetStarted}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[hsl(230,60%,52%)] to-[hsl(200,70%,40%)] text-white font-bold text-base shadow-xl flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </motion.button>
          <button
            onClick={onSuperAdmin}
            className="w-full text-center mt-3 text-muted-foreground/60 hover:text-muted-foreground text-xs transition-colors"
          >
            🔐 Super Admin Access
          </button>
        </motion.div>
      </div>
    </div>
  );
}
