import { useAppContext } from '../../context/AppContext';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { useState } from 'react';
import { api } from '../../utils/api';
import { useDarkMode } from '../../hooks/useDarkMode';

export function AppHeader() {
  const { repoInfo, appPhase, setAppPhase, setRepoInfo, setRepoUrl, sessionId, setIsInfoPanelOpen } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const handleChangeRepoClick = () => {
    if (appPhase === 'chat') {
      setIsModalOpen(true);
    } else {
      handleChangeRepoConfirm();
    }
  };

  const handleChangeRepoConfirm = async () => {
    try {
      if (sessionId) {
        await api.delete(`/repo/session/${sessionId}`);
      }
    } catch (error) {
      console.error('Error clearing session', error);
    }
    setRepoInfo(null);
    setRepoUrl('');
    setAppPhase('landing');
    setIsModalOpen(false);
  };

  return (
    <>
      <header className="flex justify-between items-center w-full px-8 py-2 bg-white border-b-2 border-neo-black h-[56px] shrink-0 z-50 relative">
        <div className="font-display font-bold text-xl uppercase text-neo-black flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
          <span>Git<span className="text-neo-blue">Chat</span></span>
        </div>
        
        {repoInfo && (
          <button 
            onClick={() => setIsInfoPanelOpen(true)}
            className="absolute left-1/2 transform -translate-x-1/2 flex items-center bg-[#ebe7e7] border-2 border-neo-black px-4 py-1 hover:bg-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-neo-black"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span className="font-mono text-[14px] font-bold text-neo-black">{repoInfo.fullName || repoInfo.name || 'repository'}</span>
          </button>
        )}

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleDarkMode}
            className="p-2 border-2 border-neo-black bg-neo-cream hover:bg-gray-200 transition-colors text-neo-black"
            title="Toggle Dark Mode"
            style={{ borderRadius: 0 }}
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>
          
          {appPhase !== 'landing' && (
            <Button variant="ghost" onClick={handleChangeRepoClick}>
              ⟳ CHANGE REPO
            </Button>
          )}
        </div>
      </header>

      <Modal
        isOpen={isModalOpen}
        title="Change Repository"
        onConfirm={handleChangeRepoConfirm}
        onCancel={() => setIsModalOpen(false)}
        confirmText="Change Repo"
      >
        <p className="text-neo-gray">Are you sure you want to analyze a different repository? This will clear your current chat history.</p>
      </Modal>
    </>
  );
}
