import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toastVariants } from '../../styles/animations';

export function Toast({ id, type, message, duration, onRemove }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [duration]);

  let bgClass = '';
  switch(type) {
    case 'error': bgClass = 'bg-neo-pink text-white'; break;
    case 'success': bgClass = 'bg-neo-green text-neo-black'; break;
    case 'warning': bgClass = 'bg-neo-orange text-white'; break;
    case 'info': bgClass = 'bg-neo-blue text-white'; break;
    default: bgClass = 'bg-white text-neo-black'; break;
  }

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial" animate="animate" exit="exit"
      className={`relative w-80 mb-2 border-2 border-neo-black overflow-hidden shadow-neo-sm ${bgClass}`}
      style={{ borderRadius: 0 }}
    >
      <div className="p-3 pr-8 text-sm font-medium">
        {message}
      </div>
      <button onClick={() => onRemove(id)} className="absolute top-2 right-2 opacity-60 hover:opacity-100">
        &times;
      </button>
      <div className="h-1 bg-black/20 absolute bottom-0 left-0" style={{ width: `${progress}%` }} />
    </motion.div>
  );
}
