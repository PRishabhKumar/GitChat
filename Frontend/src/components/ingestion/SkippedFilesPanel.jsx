import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { accordionVariants } from '../../styles/animations';

export function SkippedFilesPanel({ skippedFiles }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!skippedFiles || skippedFiles.length === 0) return null;

  return (
    <div className="w-full mt-4 border-2 border-neo-black bg-white" style={{ borderRadius: 0 }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 flex justify-between items-center hover:bg-gray-50 font-bold uppercase text-sm font-mono text-neo-gray hover:text-neo-black transition-colors"
      >
        <span>⚠️ Skipped Files ({skippedFiles.length})</span>
        <motion.svg 
          animate={{ rotate: isOpen ? 180 : 0 }} 
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </motion.svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={accordionVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="overflow-hidden"
          >
            <div className="p-4 border-t-2 border-neo-black bg-neo-cream text-xs font-mono max-h-40 overflow-y-auto">
              <ul className="list-disc pl-4 space-y-1 text-neo-gray">
                {skippedFiles.map((file, i) => (
                  <li key={i} className="truncate" title={file}>{file}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
