import { useEffect, useRef } from 'react';
import { useIngestion } from '../../hooks/useIngestion';
import { useAppContext } from '../../context/AppContext';
import { AnimatedProgressBar } from './AnimatedProgressBar';
import { PhaseStepIndicator } from './PhaseStepIndicator';
import { FileProcessingTicker } from './FileProcessingTicker';
import { IngestionStats } from './IngestionStats';
import { SkippedFilesPanel } from './SkippedFilesPanel';
import { CompletionSummary } from './CompletionSummary';
import { UrlValidationError } from '../landing/UrlValidationError';

export function IngestionView() {
  const { progress, isComplete, error, completionSummary, startIngestion } = useIngestion();
  const { setAppPhase } = useAppContext();
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      startIngestion();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        setAppPhase('chat');
      }, 2000); // Wait 2s to show READY before auto transition
      return () => clearTimeout(timer);
    }
  }, [isComplete, setAppPhase]);

  const handleStartChat = () => {
    setAppPhase('chat');
  };

  const percentage = isComplete ? 100 : (progress?.percentage || 0);
  const currentPhaseNumber = isComplete ? 5 : (progress?.phaseNumber || 1);
  const phaseLabel = isComplete ? 'Complete' : (progress?.phase || 'Initializing...');

  return (
    <div className="landing-grid-bg absolute inset-0 flex flex-col items-center justify-center p-6 min-h-screen z-0">
      <div className="w-full max-w-2xl bg-white border-4 border-neo-black shadow-neo-lg p-8 z-10 flex flex-col relative" style={{ borderRadius: 0 }}>
        
        <div className="flex items-center gap-4 mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neo-blue"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          <h2 className="font-display font-bold text-3xl uppercase">Indexing Repository</h2>
        </div>

        {error ? (
          <div className="mb-4">
            <UrlValidationError message={error} />
            <button 
              onClick={() => setAppPhase('landing')}
              className="mt-4 font-bold uppercase underline font-mono text-sm hover:text-neo-blue"
            >
              &larr; Go Back
            </button>
          </div>
        ) : (
          <div className="flex flex-col w-full gap-6">
            <PhaseStepIndicator currentPhaseNumber={currentPhaseNumber} phaseLabel={phaseLabel} />
            
            <div className="flex flex-col w-full">
              <AnimatedProgressBar percentage={percentage} isComplete={isComplete} />
              <IngestionStats progress={progress} />
            </div>

            {!isComplete && (
              <FileProcessingTicker currentFile={progress?.currentFile} />
            )}

            {!isComplete && progress?.skippedFiles?.length > 0 && (
              <SkippedFilesPanel skippedFiles={progress?.skippedFiles} />
            )}

            {isComplete && completionSummary && (
              <CompletionSummary summary={completionSummary} onStartChat={handleStartChat} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
