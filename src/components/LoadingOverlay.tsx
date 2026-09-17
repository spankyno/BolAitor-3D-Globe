import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const LOADING_TEXTS = [
  "Initializing 3D World Gallery..."
];

export default function LoadingOverlay({ onComplete }: { onComplete: () => void }) {
  const [index] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onComplete();
    }, 900);

    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-40 bg-white dark:bg-gray-950 flex items-center justify-center pointer-events-none w-full">
      <div className="text-center w-full px-4">
        <div className="h-8 relative flex items-center justify-center w-full">
          <AnimatePresence mode="popLayout">
            {index < LOADING_TEXTS.length ? (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.3 }}
                className="text-gray-600 dark:text-gray-400 font-mono text-xs tracking-widest uppercase absolute whitespace-nowrap text-center"
              >
                {LOADING_TEXTS[index]}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
