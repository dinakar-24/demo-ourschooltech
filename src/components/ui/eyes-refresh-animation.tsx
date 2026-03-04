import { motion, AnimatePresence } from 'framer-motion';

interface EyesRefreshAnimationProps {
  visible: boolean;
}

export function EyesRefreshAnimation({ visible }: EyesRefreshAnimationProps) {
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
          {/* Left eye */}
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="29" fill="#fff" stroke="#5a5ce6" strokeWidth="3" />
            <circle r="6" fill="#000">
              <animate attributeName="cx" values="32;46;32;18;32" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="cy" values="18;32;46;32;18" dur="1.4s" repeatCount="indefinite" />
            </circle>
          </svg>
          {/* Right eye */}
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="29" fill="#fff" stroke="#5a5ce6" strokeWidth="3" />
            <circle r="6" fill="#000">
              <animate attributeName="cx" values="32;46;32;18;32" dur="1.4s" begin="0.2s" repeatCount="indefinite" />
              <animate attributeName="cy" values="18;32;46;32;18" dur="1.4s" begin="0.2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
