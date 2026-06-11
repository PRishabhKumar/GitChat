import { motion, AnimatePresence } from 'framer-motion';

export function FileProcessingTicker({ currentFile }) {
  return (
    <div className="w-full h-10 bg-neo-black border-2 border-neo-black shadow-neo-sm overflow-hidden flex items-center px-4 relative" style={{ borderRadius: 0 }}>
      <AnimatePresence mode="popLayout">
        {currentFile && (
          <motion.div
            key={currentFile}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="font-mono text-sm text-neo-green truncate w-full"
          >
            &gt; {currentFile}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
