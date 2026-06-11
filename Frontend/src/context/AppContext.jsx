import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [appPhase, setAppPhase] = useState('landing'); // 'landing' | 'ingesting' | 'chat'
  const [sessionId, setSessionId] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [repoInfo, setRepoInfo] = useState(null);
  const [ingestionProgress, setIngestionProgress] = useState(null);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);

  useEffect(() => {
    let storedSession = sessionStorage.getItem('gitchat_session_id');
    if (!storedSession) {
      storedSession = uuidv4();
      sessionStorage.setItem('gitchat_session_id', storedSession);
    }
    setSessionId(storedSession);
  }, []);

  const value = {
    appPhase, setAppPhase,
    sessionId,
    repoUrl, setRepoUrl,
    repoInfo, setRepoInfo,
    ingestionProgress, setIngestionProgress,
    isInfoPanelOpen, setIsInfoPanelOpen
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
