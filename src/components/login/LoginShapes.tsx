import { motion } from 'framer-motion';

/** Rich animated abstract shapes background */
export function LoginShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large gradient orb top-right */}
      <motion.div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(260 70% 65% / 0.35), hsl(230 60% 55% / 0.15), transparent 70%)' }}
        animate={{ y: [0, -25, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Coral/pink orb bottom-right */}
      <motion.div
        className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(350 70% 60% / 0.25), hsl(0 60% 55% / 0.1), transparent 70%)' }}
        animate={{ y: [0, 15, 0], x: [0, -10, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      {/* Teal orb mid-left */}
      <motion.div
        className="absolute top-[40%] -left-24 w-64 h-64 rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(180 60% 50% / 0.2), transparent 70%)' }}
        animate={{ y: [0, -20, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Animated rings */}
      <motion.div
        className="absolute -bottom-8 -right-8 w-44 h-44 rounded-full border-[14px]"
        style={{ borderColor: 'hsl(0 70% 60% / 0.18)' }}
        animate={{ rotate: 360, scale: [1, 1.05, 1] }}
        transition={{ rotate: { duration: 25, repeat: Infinity, ease: 'linear' }, scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
      />
      <motion.div
        className="absolute top-[15%] -right-6 w-28 h-28 rounded-full border-[8px]"
        style={{ borderColor: 'hsl(45 80% 60% / 0.15)' }}
        animate={{ rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      {/* Concentric circles bottom-left */}
      <motion.div
        className="absolute bottom-24 -left-6"
        animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.25, 0.12] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-32 h-32 rounded-full border-[2.5px] border-white/12 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-[2.5px] border-white/18 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-[2px] border-white/25" />
          </div>
        </div>
      </motion.div>

      {/* Floating pills */}
      <motion.div
        className="absolute top-14 -left-12 w-48 h-16 rounded-full"
        style={{ background: 'linear-gradient(135deg, hsl(250 70% 60% / 0.2), hsl(280 60% 55% / 0.1))' }}
        animate={{ x: [0, 18, 0], rotate: [28, 35, 28] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[32%] -right-16 w-60 h-14 rounded-full"
        style={{ background: 'linear-gradient(135deg, hsl(200 70% 55% / 0.15), hsl(230 60% 55% / 0.1))' }}
        animate={{ x: [0, -15, 0], rotate: [-18, -24, -18] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />
      <motion.div
        className="absolute bottom-[35%] left-[10%] w-32 h-10 rounded-full"
        style={{ background: 'linear-gradient(90deg, hsl(170 60% 50% / 0.12), hsl(200 70% 55% / 0.08))' }}
        animate={{ x: [0, 12, 0], rotate: [10, 15, 10] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      {/* Floating particles/dots with different sizes */}
      {[
        { top: '8%', left: '25%', delay: 0, size: 8, dur: 4 },
        { top: '18%', left: '70%', delay: 0.8, size: 5, dur: 3.5 },
        { top: '35%', left: '12%', delay: 1.5, size: 6, dur: 5 },
        { top: '50%', left: '80%', delay: 0.3, size: 4, dur: 4.5 },
        { top: '65%', left: '35%', delay: 2, size: 7, dur: 3 },
        { top: '72%', left: '65%', delay: 1, size: 3, dur: 4 },
        { top: '85%', left: '20%', delay: 0.6, size: 5, dur: 5.5 },
        { top: '12%', left: '50%', delay: 1.8, size: 4, dur: 3.8 },
        { top: '55%', left: '55%', delay: 2.5, size: 6, dur: 4.2 },
        { top: '78%', left: '85%', delay: 0.4, size: 3, dur: 3.2 },
        { top: '42%', left: '42%', delay: 1.2, size: 5, dur: 4.8 },
        { top: '90%', left: '50%', delay: 3, size: 4, dur: 3.6 },
      ].map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            top: dot.top,
            left: dot.left,
            width: dot.size,
            height: dot.size,
            background: i % 3 === 0
              ? 'hsl(0 0% 100% / 0.25)'
              : i % 3 === 1
                ? 'hsl(45 80% 65% / 0.3)'
                : 'hsl(340 70% 65% / 0.25)',
          }}
          animate={{
            y: [0, -(10 + i * 2), 0],
            x: [0, (i % 2 === 0 ? 5 : -5), 0],
            opacity: [0.15, 0.5, 0.15],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: dot.dur, delay: dot.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Sparkle/star shapes */}
      {[
        { top: '15%', left: '80%', delay: 0.5, scale: 0.7 },
        { top: '60%', left: '8%', delay: 1.5, scale: 0.5 },
        { top: '82%', left: '75%', delay: 2.5, scale: 0.6 },
      ].map((star, i) => (
        <motion.svg
          key={`star-${i}`}
          className="absolute"
          style={{ top: star.top, left: star.left, width: 20 * star.scale, height: 20 * star.scale }}
          viewBox="0 0 24 24"
          fill="none"
          animate={{ rotate: [0, 180, 360], scale: [0.8, 1.2, 0.8], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 4, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M12 2L13.5 9L20 8L14.5 12L18 19L12 14.5L6 19L9.5 12L4 8L10.5 9L12 2Z" fill="hsl(45 80% 70% / 0.4)" />
        </motion.svg>
      ))}

      {/* Decorative botanical SVGs */}
      <motion.svg
        className="absolute bottom-6 left-3 w-28 h-28 text-white/[0.06]"
        viewBox="0 0 100 100"
        fill="currentColor"
        animate={{ rotate: [0, 10, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M25 80 C25 40, 50 10, 75 25 C50 25, 35 50, 25 80Z" />
        <path d="M30 85 C30 60, 48 32, 68 32 C48 38, 40 58, 30 85Z" opacity="0.6" />
        <path d="M20 78 C22 55, 35 30, 55 28 C38 35, 28 55, 20 78Z" opacity="0.4" />
      </motion.svg>
      <motion.svg
        className="absolute top-4 right-14 w-20 h-20 text-white/[0.06]"
        viewBox="0 0 80 80"
        fill="currentColor"
        animate={{ rotate: [0, -8, 0] }}
        transition={{ duration: 6, delay: 1, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M60 65 C60 30, 40 8, 18 20 C40 22, 52 42, 60 65Z" />
        <path d="M55 60 C55 35, 38 18, 22 28 C38 30, 48 45, 55 60Z" opacity="0.5" />
      </motion.svg>

      {/* Dot grid patterns */}
      <div className="absolute top-[20%] right-[8%] grid grid-cols-4 gap-3 opacity-[0.07]">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={`g1-${i}`} className="w-1.5 h-1.5 rounded-full bg-white" />
        ))}
      </div>
      <div className="absolute bottom-[22%] left-[18%] grid grid-cols-5 gap-2.5 opacity-[0.06]">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={`g2-${i}`} className="w-1 h-1 rounded-full bg-white" />
        ))}
      </div>

      {/* Wavy line */}
      <motion.svg
        className="absolute top-[55%] left-0 w-full h-16 opacity-[0.04]"
        viewBox="0 0 400 40"
        fill="none"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0 20 Q50 0, 100 20 Q150 40, 200 20 Q250 0, 300 20 Q350 40, 400 20"
          stroke="white"
          strokeWidth="2"
          animate={{ d: [
            "M0 20 Q50 0, 100 20 Q150 40, 200 20 Q250 0, 300 20 Q350 40, 400 20",
            "M0 20 Q50 40, 100 20 Q150 0, 200 20 Q250 40, 300 20 Q350 0, 400 20",
            "M0 20 Q50 0, 100 20 Q150 40, 200 20 Q250 0, 300 20 Q350 40, 400 20",
          ] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.svg>

      {/* Gradient mesh overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 80%, hsl(260 60% 50% / 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, hsl(200 70% 55% / 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, hsl(340 60% 50% / 0.04) 0%, transparent 60%)
          `,
        }}
      />
    </div>
  );
}
