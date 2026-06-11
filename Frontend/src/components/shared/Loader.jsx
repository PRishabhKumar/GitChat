import { motion } from 'framer-motion';

export function Loader({ size = 'md' }) {
  const isSm = size === 'sm';
  const sizeClass = isSm ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <div className="flex gap-1.5 items-center justify-center">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className={`${sizeClass} bg-neo-black`}
          style={{ borderRadius: 0 }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
        />
      ))}
    </div>
  );
}
