import { motion } from 'framer-motion';

/** Animated abstract shapes background for login screens */
export function LoginShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large gradient circle top-right */}
      <motion.div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(230 70% 60% / 0.4), transparent 70%)' }}
        animate={{ y: [0, -20, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Coral/red ring bottom-right */}
      <motion.div
        className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full border-[12px]"
        style={{ borderColor: 'hsl(0 70% 60% / 0.25)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
      {/* Blue pill shape top-left */}
      <motion.div
        className="absolute top-16 -left-10 w-44 h-16 rounded-full"
        style={{ background: 'linear-gradient(135deg, hsl(230 70% 55% / 0.3), hsl(200 80% 50% / 0.15))' }}
        animate={{ x: [0, 15, 0], rotate: [25, 30, 25] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Blue pill shape center-right */}
      <motion.div
        className="absolute top-[35%] -right-14 w-56 h-16 rounded-full"
        style={{ background: 'linear-gradient(135deg, hsl(220 70% 55% / 0.2), hsl(250 60% 60% / 0.15))' }}
        animate={{ x: [0, -12, 0], rotate: [-15, -20, -15] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Concentric circles bottom-left */}
      <motion.div
        className="absolute bottom-32 -left-8"
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-28 h-28 rounded-full border-2 border-white/15 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-white/20" />
        </div>
      </motion.div>
      {/* Small floating dots */}
      {[
        { top: '20%', left: '30%', delay: 0, size: 6 },
        { top: '60%', left: '15%', delay: 1.2, size: 4 },
        { top: '45%', right: '25%', delay: 0.8, size: 5 },
        { top: '75%', right: '15%', delay: 2, size: 3 },
        { top: '10%', left: '60%', delay: 1.5, size: 4 },
      ].map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/20"
          style={{ top: dot.top, left: dot.left, right: (dot as any).right, width: dot.size, height: dot.size }}
          animate={{ y: [0, -15, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3 + i * 0.5, delay: dot.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* Decorative leaf SVGs */}
      <motion.svg
        className="absolute bottom-10 left-4 w-24 h-24 text-white/[0.07]"
        viewBox="0 0 100 100"
        fill="currentColor"
        animate={{ rotate: [0, 8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M25 75 C25 35, 50 10, 75 25 C50 25, 35 50, 25 75Z" />
        <path d="M30 80 C30 60, 45 35, 65 35 C45 40, 38 58, 30 80Z" opacity="0.5" />
      </motion.svg>
      <motion.svg
        className="absolute top-6 right-16 w-16 h-16 text-white/[0.07]"
        viewBox="0 0 80 80"
        fill="currentColor"
        animate={{ rotate: [0, -6, 0] }}
        transition={{ duration: 5, delay: 1, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M60 65 C60 30, 40 8, 18 20 C40 22, 52 42, 60 65Z" />
      </motion.svg>
      {/* Dot grid pattern */}
      <div className="absolute bottom-[25%] left-[22%] grid grid-cols-5 gap-2.5 opacity-10">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-white" />
        ))}
      </div>
    </div>
  );
}
