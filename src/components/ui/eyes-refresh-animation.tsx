import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EyesRefreshAnimationProps {
  visible: boolean;
}

export function EyesRefreshAnimation({ visible }: EyesRefreshAnimationProps) {
  const [pupilX, setPupilX] = useState(0);
  
  useEffect(() => {
    if (!visible) return;
    let frame: number;
    let t = 0;
    const animate = () => {
      t += 0.06;
      setPupilX(Math.sin(t * 1.8) * 7);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center gap-[18px] bg-background"
        >
          {[0, 1].map((i) => (
            <svg key={i} width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="hsl(var(--background))" stroke="#6366f1" strokeWidth="2.5" />
              <circle cx={40 + pupilX} cy={40} r="7" fill="hsl(var(--foreground))" />
            </svg>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
