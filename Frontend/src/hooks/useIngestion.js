import { useState, useRef } from 'react';
import { useSSE } from './useSSE';
import { useAppContext } from '../context/AppContext';

export function useIngestion() {
  const { connect, cancel } = useSSE();
  const { sessionId, repoUrl, setRepoInfo } = useAppContext();
  
  const [progress, setProgress] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);
  const [completionSummary, setCompletionSummary] = useState(null);
  const started = useRef(false);

  const startIngestion = () => {
    if (started.current) return;
    started.current = true;
    setProgress(null);
    setIsComplete(false);
    setError(null);
    setCompletionSummary(null);

    connect('/api/repo/ingest', {
      method: 'POST',
      body: { repoUrl, sessionId }
    }, {
      onMessage: (data) => {
        if (data.type === 'start') {
          setRepoInfo(data.repoInfo);
        } else if (data.type === 'progress') {
          setProgress(data);
        } else if (data.type === 'complete') {
          setRepoInfo(data.repoInfo);
          setCompletionSummary(data);
          setIsComplete(true);
        } else if (data.type === 'error') {
          setError(data.message);
        }
      },
      onError: (err) => {
        setError(err.message || 'Connection lost.');
      },
      onClose: () => {
        // stream ended
      }
    });
  };

  return { progress, isComplete, error, completionSummary, startIngestion, cancel };
}
