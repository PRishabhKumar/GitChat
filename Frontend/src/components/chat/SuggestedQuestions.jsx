import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../styles/animations';
import { SUGGESTED_QUESTIONS } from '../../constants/suggestedQuestions';

export function SuggestedQuestions({ onSelect }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-3xl mx-auto p-4">
      <p className="font-mono text-sm uppercase text-neo-gray font-bold tracking-widest mb-6">TRY ASKING...</p>
      
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
      >
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <motion.button
            key={i}
            variants={staggerItem}
            onClick={() => onSelect(q)}
            whileHover={{ scale: 0.98, borderColor: '#0055FF' }}
            whileTap={{ scale: 0.95 }}
            className="bg-white border-2 border-neo-black shadow-neo-sm p-4 text-left font-body text-base font-medium hover:bg-gray-50 transition-colors"
            style={{ borderRadius: 0 }}
          >
            {q}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
