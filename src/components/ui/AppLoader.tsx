import { motion } from 'framer-motion';
import appLogo from '@/assets/logo.png';

export function AppLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B1120] relative overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(200 60% 50% / 0.12), transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/3 w-[250px] h-[250px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(170 50% 45% / 0.1), transparent 70%)' }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Logo with pulse ring */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative">
          {/* Pulsing rings */}
          <motion.div
            className="absolute inset-0 rounded-2xl border border-white/10"
            animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            style={{ originX: 0.5, originY: 0.5 }}
          />
          <motion.div
            className="absolute inset-0 rounded-2xl border border-white/10"
            animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
          />

          {/* Logo container */}
          <motion.div
            className="w-16 h-16 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <img src={appLogo} alt="Loading" className="w-10 h-10 object-contain" />
          </motion.div>
        </div>

        {/* Animated dots loader */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-white/40"
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Message */}
        <motion.p
          className="text-white/30 text-xs font-medium tracking-wider uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
}
