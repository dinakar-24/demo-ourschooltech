import { motion } from 'framer-motion';

/** Minimal, elegant floating shapes background */
export function LoginShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Soft gradient orbs */}
      <motion.div
        className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(220 80% 70% / 0.18), transparent 70%)' }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(200 70% 55% / 0.15), transparent 70%)' }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute top-1/3 -right-20 w-[300px] h-[300px] rounded-full"
        style={{ background: 'radial-gradient(circle, hsl(260 60% 65% / 0.12), transparent 70%)' }}
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating glass circles */}
      <motion.div
        className="absolute top-[15%] right-[10%] w-20 h-20 rounded-full border border-white/[0.08]"
        style={{ background: 'linear-gradient(135deg, hsl(220 80% 70% / 0.06), transparent)' }}
        animate={{ y: [0, -15, 0], rotate: [0, 90, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[20%] left-[8%] w-14 h-14 rounded-full border border-white/[0.06]"
        style={{ background: 'linear-gradient(135deg, hsl(200 60% 60% / 0.08), transparent)' }}
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />
      <motion.div
        className="absolute top-[60%] right-[15%] w-10 h-10 rounded-full border border-white/[0.05]"
        animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      {/* Gradient mesh overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 80%, hsl(240 50% 45% / 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 15%, hsl(200 60% 50% / 0.08) 0%, transparent 50%)
          `,
        }}
      />
    </div>
  );
}
