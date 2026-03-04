import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EyesRefreshAnimationProps {
  visible: boolean;
}

export function EyesRefreshAnimation({ visible }: EyesRefreshAnimationProps) {
  const p1Ref = useRef<SVGCircleElement>(null);
  const p2Ref = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!visible) return;
    const p1 = p1Ref.current;
    const p2 = p2Ref.current;
    if (!p1 || !p2) return;

    let raf: number;
    const start = performance.now();
    const DUR = 1400;
    const DELAY = 200;
    const ORBIT = 18;
    const TWO_PI = Math.PI * 2;
    const CX = 32;
    const CY = 32;

    const tick = (now: number) => {
      const e = now - start;
      const a1 = ((e % DUR) / DUR) * TWO_PI - Math.PI / 2;
      p1.setAttribute('cx', String(CX + Math.cos(a1) * ORBIT));
      p1.setAttribute('cy', String(CY + Math.sin(a1) * ORBIT));

      const a2 = ((Math.max(0, e - DELAY) % DUR) / DUR) * TWO_PI - Math.PI / 2;
      p2.setAttribute('cx', String(CX + Math.cos(a2) * ORBIT));
      p2.setAttribute('cy', String(CY + Math.sin(a2) * ORBIT));

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
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
            <circle ref={p1Ref} cx="32" cy="14" r="6" fill="#000" />
          </svg>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="29" fill="#fff" stroke="#5a5ce6" strokeWidth="3" />
            <circle ref={p2Ref} cx="32" cy="14" r="6" fill="#000" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
