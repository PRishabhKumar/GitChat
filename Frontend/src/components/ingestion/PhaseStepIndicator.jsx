import { motion, AnimatePresence } from 'framer-motion';

export function PhaseStepIndicator({ currentPhaseNumber, totalPhases = 4, phaseLabel }) {
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex gap-2 w-full h-3">
        {Array.from({ length: totalPhases }).map((_, i) => {
          const stepNum = i + 1;
          let bgClass = 'bg-neo-cream';
          if (stepNum < currentPhaseNumber) bgClass = 'bg-neo-green';
          else if (stepNum === currentPhaseNumber) bgClass = 'bg-neo-blue';

          return (
            <div 
              key={i} 
              className={`flex-1 border-2 border-neo-black transition-colors duration-300 ${bgClass}`}
              style={{ borderRadius: 0 }}
            />
          );
        })}
      </div>
      <div className="h-6 flex items-center justify-center font-mono text-sm font-bold uppercase text-neo-orange overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={phaseLabel}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {phaseLabel}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
