import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalBackdropVariants, modalBoxVariants } from '../../styles/animations';

export function Modal({ isOpen, title, children, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (isOpen && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            variants={modalBackdropVariants}
            initial="initial" animate="animate" exit="exit"
            onClick={onCancel}
            className="absolute inset-0 bg-black"
          />
          <motion.div
            variants={modalBoxVariants}
            initial="initial" animate="animate" exit="exit"
            className="relative bg-white border-2 border-neo-black shadow-neo-lg flex flex-col p-6 max-w-md w-full"
            style={{ borderRadius: 0 }}
          >
            <h2 className="font-display font-bold text-2xl mb-4">{title}</h2>
            <div className="mb-8">{children}</div>
            <div className="flex justify-end gap-4">
              <button onClick={onCancel} className="px-4 py-2 border-2 border-neo-black hover:bg-gray-100 font-bold uppercase transition-colors" style={{ borderRadius: 0 }}>
                {cancelText}
              </button>
              <button ref={confirmRef} onClick={onConfirm} className="px-4 py-2 bg-neo-pink text-white border-2 border-neo-black hover:opacity-90 font-bold uppercase transition-opacity" style={{ borderRadius: 0 }}>
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
