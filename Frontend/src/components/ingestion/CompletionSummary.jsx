import { motion } from 'framer-motion';
import { stampVariants } from '../../styles/animations';
import { LanguagePill } from '../shared/LanguagePill';
import { Button } from '../shared/Button';
import { formatNumber } from '../../utils/formatters';

export function CompletionSummary({ summary, onStartChat }) {
  if (!summary) return null;
  const { totalFiles, totalChunks, languages, skippedCount } = summary;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col items-center mt-8 p-6 bg-white border-2 border-neo-black shadow-neo relative"
      style={{ borderRadius: 0 }}
    >
      <motion.div 
        variants={stampVariants}
        initial="initial"
        animate="animate"
        className="absolute -top-6 -right-6 border-4 border-neo-green text-neo-green font-display font-black text-3xl px-4 py-1 bg-white shadow-neo-sm transform rotate-[-2deg] z-10"
        style={{ borderRadius: 0 }}
      >
        READY
      </motion.div>

      <h3 className="font-display font-bold text-2xl uppercase mb-6 text-center w-full border-b-2 border-neo-black pb-4">
        Analysis Complete
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-6">
        <div className="flex flex-col items-center bg-neo-cream border-2 border-neo-black p-3">
          <span className="font-mono text-xs text-neo-gray uppercase font-bold">Files</span>
          <span className="font-display text-2xl font-bold">{formatNumber(totalFiles)}</span>
        </div>
        <div className="flex flex-col items-center bg-neo-cream border-2 border-neo-black p-3">
          <span className="font-mono text-xs text-neo-gray uppercase font-bold">Chunks</span>
          <span className="font-display text-2xl font-bold">{formatNumber(totalChunks)}</span>
        </div>
        <div className="col-span-2 flex flex-col items-center justify-center bg-neo-cream border-2 border-neo-black p-3">
          <span className="font-mono text-xs text-neo-gray uppercase font-bold mb-2">Languages</span>
          <div className="flex flex-wrap gap-2 justify-center">
            {languages && Object.keys(languages).slice(0, 3).map(lang => (
              <LanguagePill key={lang} language={lang} />
            ))}
            {languages && Object.keys(languages).length > 3 && (
              <span className="text-xs font-mono text-neo-gray self-center">+{Object.keys(languages).length - 3}</span>
            )}
          </div>
        </div>
      </div>

      <Button onClick={onStartChat} variant="primary" className="w-full h-14 text-lg">
        START CHATTING &rarr;
      </Button>
    </motion.div>
  );
}
