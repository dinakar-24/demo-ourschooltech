import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EyesRefreshAnimationProps {
  visible: boolean;
}

export function EyesRefreshAnimation({ visible }: EyesRefreshAnimationProps) {
  const [a1, setA1] = useState(0);
  const [a2, setA2] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    let frame: number;
    const DURATION = 1400; // 1.4s per loop
    const DELAY2 = 200; // 0.2s offset for second eye
    const TWO_PI = Math.PI * 2;

    const tick = (now: number) => {
      const elapsed = now - start;
      setA1(((elapsed % DURATION) / DURATION) * TWO_PI);
      const e2 = Math.max(0, elapsed - DELAY2);
      setA2(((e2 % DURATION) / DURATION) * TWO_PI);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  const ORBIT = 16;
  const R_EYE = 29; // visible radius inside 3px stroke on 64px svg
  const R_PUPIL = 6;
  const CENTER = 32;

  const pupil = (angle: number) => ({
    cx: CENTER + Math.cos(angle) * ORBIT,
    cy: CENTER + Math.sin(angle) * ORBIT,
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
          style={{ gap: 20 }}
        >
          {[a1, a2].map((a, i) => {
            const p = pupil(a);
            return (
              <svg key={i} width="64" height="64" viewBox="0 0 64 64">
                <circle cx={CENTER} cy={CENTER} r={R_EYE} fill="#fff" stroke="#5a5ce6" strokeWidth="3" />
                <circle cx={p.cx} cy={p.cy} r={R_PUPIL} fill="#000" />
              </svg>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
