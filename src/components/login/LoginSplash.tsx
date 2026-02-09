import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { LoginShapes } from './LoginShapes';
import appLogo from '@/assets/logo.png';

interface LoginSplashProps {
  onGetStarted: () => void;
  onSuperAdmin: () => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 18, stiffness: 180 } },
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
        {/* Illustration area */}
        <motion.div variants={item} className="mb-4">
          <div className="relative w-72 h-56 mx-auto">
            {/* Background abstract shape behind illustration */}
            <motion.div
              className="absolute inset-x-4 bottom-8 top-4 rounded-[30px]"
              style={{ background: 'linear-gradient(135deg, hsl(230 50% 70% / 0.2), hsl(200 60% 60% / 0.1))' }}
              animate={{ scale: [1, 1.03, 1], rotate: [0, 1, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Couch */}
            <motion.svg
              viewBox="0 0 280 110"
              className="absolute bottom-2 left-0 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              <rect x="50" y="35" width="180" height="50" rx="14" fill="hsl(220 10% 82%)" />
              <rect x="38" y="22" width="42" height="68" rx="12" fill="hsl(220 10% 77%)" />
              <rect x="200" y="22" width="42" height="68" rx="12" fill="hsl(220 10% 77%)" />
              {/* Pillow */}
              <motion.rect
                x="75" y="38" width="48" height="32" rx="8"
                fill="hsl(45 90% 62%)"
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Laptop on pillow */}
              <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
                <rect x="82" y="42" width="28" height="18" rx="2" fill="hsl(0 0% 95%)" />
                <rect x="84" y="44" width="24" height="12" rx="1" fill="hsl(210 80% 55%)" />
              </motion.g>
              <circle cx="62" cy="95" r="5" fill="hsl(25 45% 38%)" />
              <circle cx="222" cy="95" r="5" fill="hsl(25 45% 38%)" />
              {/* Plants */}
              <motion.g
                transform="translate(8,42)"
                animate={{ rotate: [0, 3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <rect x="6" y="28" width="14" height="18" rx="3" fill="hsl(45 75% 52%)" />
                <ellipse cx="13" cy="24" rx="12" ry="14" fill="hsl(140 55% 48%)" />
                <ellipse cx="6" cy="28" rx="7" ry="10" fill="hsl(140 50% 42%)" />
                <ellipse cx="18" cy="26" rx="5" ry="8" fill="hsl(140 60% 52%)" />
              </motion.g>
              <motion.g
                transform="translate(238,42)"
                animate={{ rotate: [0, -3, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <rect x="0" y="28" width="14" height="18" rx="3" fill="hsl(200 65% 50%)" />
                <ellipse cx="7" cy="24" rx="12" ry="14" fill="hsl(140 55% 48%)" />
                <ellipse cx="14" cy="28" rx="7" ry="10" fill="hsl(140 50% 42%)" />
              </motion.g>
            </motion.svg>

            {/* Male graduate — animated idle */}
            <motion.svg
              viewBox="0 0 80 165"
              className="absolute bottom-0 left-[14%] w-[72px] h-[140px]"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, type: 'spring', damping: 16, stiffness: 120 }}
            >
              {/* Shadow */}
              <ellipse cx="40" cy="158" rx="18" ry="4" fill="hsl(230 50% 35% / 0.3)" />
              {/* Body */}
              <circle cx="40" cy="28" r="16" fill="hsl(200 55% 58%)" />
              {/* Grad cap */}
              <motion.g animate={{ rotate: [-2, 2, -2], y: [0, -1, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                <rect x="20" y="12" width="40" height="8" rx="2" fill="hsl(220 55% 42%)" />
                <rect x="28" y="5" width="24" height="9" rx="2" fill="hsl(220 55% 42%)" />
                <circle cx="40" cy="8" r="2" fill="hsl(45 80% 55%)" />
                {/* Tassel */}
                <motion.line x1="54" y1="12" x2="60" y2="24" stroke="hsl(45 80% 55%)" strokeWidth="1.5" animate={{ x2: [60, 62, 60] }} transition={{ duration: 2, repeat: Infinity }} />
                <motion.circle cx="60" cy="24" r="2" fill="hsl(45 80% 55%)" animate={{ cx: [60, 62, 60] }} transition={{ duration: 2, repeat: Infinity }} />
              </motion.g>
              {/* Shirt */}
              <rect x="28" y="44" width="24" height="40" rx="6" fill="hsl(210 25% 88%)" />
              <line x1="40" y1="44" x2="40" y2="65" stroke="hsl(210 20% 78%)" strokeWidth="1" />
              {/* Arms */}
              <motion.rect x="22" y="48" width="10" height="30" rx="5" fill="hsl(200 55% 58%)" transform="rotate(-15 27 48)" animate={{ rotate: [-15, -20, -15] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
              <motion.rect x="48" y="48" width="10" height="30" rx="5" fill="hsl(200 55% 58%)" transform="rotate(15 53 48)" animate={{ rotate: [15, 20, 15] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }} />
              {/* Legs */}
              <rect x="30" y="83" width="10" height="38" rx="5" fill="hsl(215 65% 52%)" />
              <rect x="42" y="83" width="10" height="38" rx="5" fill="hsl(215 65% 52%)" />
              <rect x="28" y="118" width="14" height="6" rx="3" fill="hsl(220 30% 35%)" />
              <rect x="40" y="118" width="14" height="6" rx="3" fill="hsl(220 30% 35%)" />
              {/* Sunglasses */}
              <rect x="27" y="24" width="11" height="7" rx="2.5" fill="hsl(0 0% 12%)" />
              <rect x="42" y="24" width="11" height="7" rx="2.5" fill="hsl(0 0% 12%)" />
              <line x1="38" y1="27" x2="42" y2="27" stroke="hsl(0 0% 12%)" strokeWidth="1.5" />
              {/* Smile */}
              <path d="M35 34 Q40 38, 45 34" stroke="hsl(200 45% 45%)" strokeWidth="1.2" fill="none" />
            </motion.svg>

            {/* Female graduate — animated idle */}
            <motion.svg
              viewBox="0 0 80 165"
              className="absolute bottom-0 right-[14%] w-[72px] h-[140px]"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, type: 'spring', damping: 16, stiffness: 120 }}
            >
              <ellipse cx="40" cy="158" rx="18" ry="4" fill="hsl(230 50% 35% / 0.3)" />
              <circle cx="40" cy="28" r="16" fill="hsl(200 50% 52%)" />
              {/* Hair */}
              <path d="M24 30 C24 16, 30 6, 40 6 C50 6, 56 16, 56 30 C56 22, 60 38, 56 48 C52 44, 28 44, 24 48 C20 38, 24 22, 24 30Z" fill="hsl(280 35% 28%)" />
              {/* Grad cap */}
              <motion.g animate={{ rotate: [2, -2, 2], y: [0, -1, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
                <rect x="20" y="10" width="40" height="8" rx="2" fill="hsl(220 55% 42%)" />
                <rect x="28" y="3" width="24" height="9" rx="2" fill="hsl(220 55% 42%)" />
                <circle cx="40" cy="6" r="2" fill="hsl(45 80% 55%)" />
              </motion.g>
              {/* Jacket */}
              <rect x="28" y="44" width="24" height="40" rx="6" fill="hsl(222 48% 28%)" />
              {/* Scarf/tie */}
              <rect x="35" y="44" width="10" height="16" rx="2" fill="hsl(35 80% 55%)" />
              {/* Arms */}
              <motion.rect x="22" y="48" width="10" height="28" rx="5" fill="hsl(200 50% 52%)" animate={{ rotate: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
              <motion.rect x="48" y="48" width="10" height="28" rx="5" fill="hsl(200 50% 52%)" animate={{ rotate: [0, 5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
              {/* Legs */}
              <rect x="30" y="83" width="10" height="38" rx="5" fill="hsl(215 65% 52%)" />
              <rect x="42" y="83" width="10" height="38" rx="5" fill="hsl(215 65% 52%)" />
              <rect x="28" y="118" width="14" height="6" rx="3" fill="hsl(220 30% 35%)" />
              <rect x="40" y="118" width="14" height="6" rx="3" fill="hsl(220 30% 35%)" />
              {/* Sunglasses */}
              <rect x="27" y="24" width="11" height="7" rx="2.5" fill="hsl(0 0% 12%)" />
              <rect x="42" y="24" width="11" height="7" rx="2.5" fill="hsl(0 0% 12%)" />
              <line x1="38" y1="27" x2="42" y2="27" stroke="hsl(0 0% 12%)" strokeWidth="1.5" />
              {/* Headphones */}
              <path d="M22 24 C22 12, 30 5, 40 5 C50 5, 58 12, 58 24" stroke="hsl(280 38% 32%)" strokeWidth="3.5" fill="none" />
              <circle cx="22" cy="26" r="5" fill="hsl(280 38% 32%)" />
              <circle cx="58" cy="26" r="5" fill="hsl(280 38% 32%)" />
              {/* Diploma */}
              <motion.rect x="52" y="58" width="4" height="20" rx="2" fill="hsl(0 0% 96%)" transform="rotate(15 54 68)" animate={{ rotate: [15, 20, 15] }} transition={{ duration: 2, repeat: Infinity }} />
              {/* Smile */}
              <path d="M35 34 Q40 38, 45 34" stroke="hsl(200 40% 40%)" strokeWidth="1.2" fill="none" />
            </motion.svg>

            {/* Floating checkmark */}
            <motion.div
              className="absolute top-2 left-[38%]"
              animate={{ y: [0, -10, 0], rotate: [0, 8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                <rect width="38" height="38" rx="10" fill="hsl(200 60% 60% / 0.45)" />
                <path d="M11 19 L17 25 L27 13" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>

            {/* Floating book icon */}
            <motion.div
              className="absolute top-6 right-2"
              animate={{ y: [0, -6, 0], rotate: [-5, 5, -5] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="4" width="24" height="20" rx="3" fill="hsl(350 65% 55% / 0.4)" />
                <rect x="4" y="6" width="20" height="16" rx="2" fill="hsl(350 65% 55% / 0.6)" />
                <line x1="14" y1="6" x2="14" y2="22" stroke="white" strokeWidth="1" opacity="0.5" />
              </svg>
            </motion.div>

            {/* Floating A+ badge */}
            <motion.div
              className="absolute bottom-12 right-0"
              animate={{ y: [0, -5, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                <circle cx="15" cy="15" r="14" fill="hsl(45 85% 55% / 0.5)" />
                <text x="15" y="18" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">A+</text>
              </svg>
            </motion.div>
          </div>
        </motion.div>

        {/* Welcome badge */}
        <motion.div variants={item}>
          <motion.div
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[hsl(0,72%,55%)] to-[hsl(15,80%,52%)] text-white px-9 py-3.5 rounded-full font-bold text-base shadow-xl shadow-[hsl(0,70%,50%)/0.3]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ scale: [1, 1.04, 1], boxShadow: [
              '0 10px 30px -5px hsl(0 70% 50% / 0.3)',
              '0 15px 40px -5px hsl(0 70% 50% / 0.45)',
              '0 10px 30px -5px hsl(0 70% 50% / 0.3)',
            ]}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-xl">❤️</span>
            WELCOME
          </motion.div>
        </motion.div>

        {/* Brand */}
        <motion.div variants={item} className="mt-7 flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/25 mb-4 overflow-hidden">
            <img src={appLogo} alt="Our School Tech" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">
            Our School Tech
          </h1>
          <motion.p
            className="text-white/55 text-sm mt-2 max-w-[260px]"
            animate={{ opacity: [0.55, 0.8, 0.55] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
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
              whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              {f}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom CTA area — curved top edge */}
      <div className="relative z-10">
        <svg viewBox="0 0 400 50" className="w-full -mb-1 text-white" preserveAspectRatio="none">
          <path d="M0 50 L0 30 Q60 0, 140 18 Q220 36, 300 14 Q360 0, 400 16 L400 50 Z" fill="currentColor" />
        </svg>
        <motion.div
          className="bg-white px-6 pb-8 pt-5 safe-area-bottom"
          initial={{ y: 70, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', damping: 20, stiffness: 150 }}
        >
          <motion.button
            onClick={onGetStarted}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[hsl(230,60%,52%)] via-[hsl(220,65%,48%)] to-[hsl(200,70%,42%)] text-white font-bold text-base shadow-xl shadow-[hsl(220,60%,45%)/0.35] flex items-center justify-center gap-2"
            whileHover={{ scale: 1.03, boxShadow: '0 20px 40px -10px hsl(220 60% 45% / 0.5)' }}
            whileTap={{ scale: 0.96 }}
            animate={{ boxShadow: [
              '0 10px 25px -8px hsl(220 60% 45% / 0.35)',
              '0 18px 35px -8px hsl(220 60% 45% / 0.5)',
              '0 10px 25px -8px hsl(220 60% 45% / 0.35)',
            ]}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            Get Started
            <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
              <ArrowRight className="w-5 h-5" />
            </motion.span>
          </motion.button>
          <button
            onClick={onSuperAdmin}
            className="w-full text-center mt-3 text-muted-foreground/50 hover:text-muted-foreground text-xs transition-colors"
          >
            🔐 Super Admin Access
          </button>
        </motion.div>
      </div>
    </div>
  );
}
