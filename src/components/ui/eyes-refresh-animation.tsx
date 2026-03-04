import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EyesRefreshAnimationProps {
  visible: boolean;
}

export function EyesRefreshAnimation({ visible }: EyesRefreshAnimationProps) {
  const [angle1, setAngle1] = useState(0);
  const [angle2, setAngle2] = useState(-0.6); // slight offset for liveliness

  useEffect(() => {
    if (!visible) return;
    let frame: number;
    let t = 0;

    const animate = () => {
      t += 0.025;
      // Smooth circular orbit: left → top → right → bottom → repeat
      setAngle1(t * Math.PI * 2 * 0.4); // ~0.4 rev/sec
      setAngle2(t * Math.PI * 2 * 0.4 - 0.6); // offset by ~0.6 rad
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  const ORBIT_RADIUS = 10; // how far pupil travels from center
  const EYE_R = 34;
  const PUPIL_R = 7;

  const getPupilPos = (angle: number) => ({
    cx: 40 + Math.cos(angle) * ORBIT_RADIUS,
    cy: 40 + Math.sin(angle) * ORBIT_RADIUS,
  });

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
          {[angle1, angle2].map((angle, i) => {
            const pos = getPupilPos(angle);
            return (
              <svg key={i} width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r={EYE_R} fill="hsl(var(--background))" stroke="#6366f1" strokeWidth="2.5" />
                <circle cx={pos.cx} cy={pos.cy} r={PUPIL_R} fill="hsl(var(--foreground))" />
              </svg>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
