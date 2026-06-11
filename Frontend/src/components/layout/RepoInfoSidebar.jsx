import { motion, AnimatePresence } from 'framer-motion';
import { sidebarVariants } from '../../styles/animations';
import { useAppContext } from '../../context/AppContext';
import { LanguagePill } from '../shared/LanguagePill';
import { formatRelativeTime, formatNumber } from '../../utils/formatters';
import { useEffect } from 'react';

export function RepoInfoSidebar() {
  const { isInfoPanelOpen, setIsInfoPanelOpen, repoInfo } = useAppContext();

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsInfoPanelOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setIsInfoPanelOpen]);

  if (!repoInfo) return null;

  return (
    <AnimatePresence>
      {isInfoPanelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsInfoPanelOpen(false)}
            className="fixed inset-0 bg-black z-40 md:hidden"
          />
          <motion.aside
            variants={sidebarVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed md:static top-0 right-0 w-full md:w-80 h-full border-l-4 border-neo-black bg-white flex flex-col z-50 shrink-0 overflow-y-auto"
          >
            <div className="p-6 border-b-2 border-neo-black flex flex-col gap-2 relative">
              <button 
                onClick={() => setIsInfoPanelOpen(false)}
                className="absolute top-4 right-4 text-neo-gray hover:text-neo-black"
              >
                &times;
              </button>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                <h2 className="font-display font-bold text-2xl uppercase">REPO INFO</h2>
              </div>
              <p className="font-mono text-sm text-neo-gray">{repoInfo.fullName || repoInfo.name}</p>
              {repoInfo.description && (
                <p className="text-sm mt-2">{repoInfo.description}</p>
              )}
            </div>

            <div className="p-6 grid grid-cols-2 gap-4 border-b-2 border-neo-black bg-neo-cream">
              <div className="bg-white border-2 border-neo-black p-2 flex flex-col items-center">
                <span className="font-mono text-xs text-neo-gray uppercase">STARS</span>
                <span className="font-display font-bold text-2xl">{formatNumber(repoInfo.stargazersCount)}</span>
              </div>
              <div className="bg-white border-2 border-neo-black p-2 flex flex-col items-center">
                <span className="font-mono text-xs text-neo-gray uppercase">FORKS</span>
                <span className="font-display font-bold text-2xl">{formatNumber(repoInfo.forksCount)}</span>
              </div>
              <div className="col-span-2 bg-white border-2 border-neo-black p-2 flex flex-col items-center">
                <span className="font-mono text-xs text-neo-gray uppercase">LAST ANALYZED</span>
                <span className="font-mono text-sm">{formatRelativeTime(repoInfo.updatedAt || new Date())}</span>
              </div>
            </div>

            {repoInfo.languages && Object.keys(repoInfo.languages).length > 0 && (
              <div className="p-6 flex flex-col gap-4 border-b-2 border-neo-black">
                <h3 className="font-mono text-xs font-bold uppercase text-neo-gray">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(repoInfo.languages).map(lang => (
                    <LanguagePill key={lang} language={lang} />
                  ))}
                </div>
              </div>
            )}
            
            {repoInfo.totalFiles != null && (
              <div className="p-6 grid grid-cols-2 gap-4 border-b-2 border-neo-black bg-neo-cream">
                <div className="bg-white border-2 border-neo-black p-2 flex flex-col items-center">
                  <span className="font-mono text-xs text-neo-gray uppercase">FILES</span>
                  <span className="font-display font-bold text-2xl">{formatNumber(repoInfo.totalFiles)}</span>
                </div>
                <div className="bg-white border-2 border-neo-black p-2 flex flex-col items-center">
                  <span className="font-mono text-xs text-neo-gray uppercase">CHUNKS</span>
                  <span className="font-display font-bold text-2xl">{formatNumber(repoInfo.totalChunks || 0)}</span>
                </div>
              </div>
            )}

          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
