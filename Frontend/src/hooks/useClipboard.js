import { useState, useCallback } from 'react';

export function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback((text) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return false;
    }

    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (error) {
      console.error('Copy failed', error);
      return false;
    }
  }, []);

  return { copied, copy };
}
