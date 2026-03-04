import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EyesRefreshAnimationProps {
  visible: boolean;
}

export function EyesRefreshAnimation({ visible }: EyesRefreshAnimationProps) {
  const rafRef = useRef<number>(0);
  const [p1, setP1] = useState({ cx: 32, cy: 32 });
  const [p2, setP2] = useState({ cx: 32, cy: 32 });

  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    const DURATION = 1400;
    const DELAY = 200;
    const ORBIT = 18;
    const TWO_PI = Math.PI * 2;
    const CX = 32;
    const CY = 32;

    const tick = (now: number) => {
      const t1 = ((now - start) % DURATION) / DURATION;
      const a1 = t1 * TWO_PI - Math.PI / 2; // start from top
      setP1({ cx: CX + Math.cos(a1) * ORBIT, cy: CY + Math.sin(a1) * ORBIT });

      const t2 = (Math.max(0, now - start - DELAY) % DURATION) / DURATION;
      const a2 = t2 * TWO_PI - Math.PI / 2;
      setP2({ cx: CX + Math.cos(a2) * ORBIT, cy: CY + Math.sin(a2) * ORBIT });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
          style={{ gap: 16 }}
        >
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="29" fill="#fff" stroke="#5a5ce6" strokeWidth="3" />
            <circle cx={p1.cx} cy={p1.cy} r="6" fill="#000" />
          </svg>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="29" fill="#fff" stroke="#5a5ce6" strokeWidth="3" />
            <circle cx={p2.cx} cy={p2.cy} r="6" fill="#000" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
