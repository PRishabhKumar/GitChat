import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { accordionVariants } from '../../styles/animations';
import { SourceChunkCard } from './SourceChunkCard';

export function SourceChunksPanel({ sources }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="w-full mt-2 self-start max-w-[80%]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-neo-blue hover:text-neo-black transition-colors"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
        Sources ({sources.length})
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={accordionVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="overflow-hidden mt-2"
          >
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 custom-scrollbar">
              {sources.map((chunk, i) => (
                <SourceChunkCard key={i} chunk={chunk} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
