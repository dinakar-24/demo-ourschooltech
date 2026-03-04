import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EyesRefreshAnimationProps {
  visible: boolean;
  message?: string;
}

export function EyesRefreshAnimation({ visible, message = "Checking for updates..." }: EyesRefreshAnimationProps) {
  const [pupilX, setPupilX] = useState(0);
  
  useEffect(() => {
    if (!visible) return;
    
    // Animate pupils looking left-right
    let frame: number;
    let t = 0;
    
    const animate = () => {
      t += 0.06;
      // Smooth left-right-center pattern
      const x = Math.sin(t * 1.8) * 5;
      setPupilX(x);
      frame = requestAnimationFrame(animate);
    };
    
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
        >
          <div className="flex flex-col items-center gap-2 bg-card/95 backdrop-blur-md border border-border rounded-2xl px-6 py-4 shadow-lg">
            {/* Eyes container */}
            <div className="flex items-center gap-3">
              {/* Left eye */}
              <svg width="36" height="36" viewBox="0 0 36 36">
                <ellipse
                  cx="18" cy="18" rx="14" ry="14"
                  fill="hsl(var(--background))"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                />
                {/* Pupil */}
                <circle
                  cx={18 + pupilX}
                  cy={18 + Math.sin(pupilX * 0.5) * 2}
                  r="4.5"
                  fill="hsl(var(--foreground))"
                />
                {/* Glint */}
                <circle
                  cx={20 + pupilX}
                  cy={16 + Math.sin(pupilX * 0.5) * 2}
                  r="1.5"
                  fill="hsl(var(--background))"
                />
              </svg>

              {/* Right eye */}
              <svg width="36" height="36" viewBox="0 0 36 36">
                <ellipse
                  cx="18" cy="18" rx="14" ry="14"
                  fill="hsl(var(--background))"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2.5"
                />
                {/* Pupil */}
                <circle
                  cx={18 + pupilX}
                  cy={18 + Math.sin(pupilX * 0.5) * 2}
                  r="4.5"
                  fill="hsl(var(--foreground))"
                />
                {/* Glint */}
                <circle
                  cx={20 + pupilX}
                  cy={16 + Math.sin(pupilX * 0.5) * 2}
                  r="1.5"
                  fill="hsl(var(--background))"
                />
              </svg>
            </div>

            {/* Message */}
            <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
