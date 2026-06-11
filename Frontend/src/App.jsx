import { useAppContext } from './context/AppContext';
import { ToastContainer } from './components/shared/ToastContainer';
import { AppHeader } from './components/layout/AppHeader';
import { RepoInfoSidebar } from './components/layout/RepoInfoSidebar';
import { LandingPage } from './components/landing/LandingPage';
import { IngestionView } from './components/ingestion/IngestionView';
import { ChatView } from './components/chat/ChatView';

function AppContent() {
  const { appPhase } = useAppContext();

  return (
    <div className="flex flex-col h-screen w-full bg-neo-cream font-body overflow-hidden">
      <AppHeader />
      
      <main className="flex-1 flex overflow-hidden relative">
        {appPhase === 'landing' && <LandingPage />}
        {appPhase === 'ingesting' && <IngestionView />}
        {appPhase === 'chat' && (
          <div className="flex w-full h-full">
            <div className="flex-1 overflow-hidden relative">
              <ChatView />
            </div>
            <RepoInfoSidebar />
          </div>
        )}
      </main>
      <ToastContainer />
    </div>
  );
}

export default AppContent;
