import { motion, AnimatePresence } from 'framer-motion';

export function ScrollToBottomBtn({ show, onClick, hasNewMessage }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={onClick}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white border-2 border-neo-black shadow-neo px-4 py-2 font-bold uppercase text-sm z-20 flex items-center gap-2 hover:bg-gray-100 transition-colors"
          style={{ borderRadius: 0 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
          Scroll to Bottom
          {hasNewMessage && (
            <span className="w-2 h-2 bg-neo-pink rounded-full absolute -top-1 -right-1 border border-neo-black" />
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
