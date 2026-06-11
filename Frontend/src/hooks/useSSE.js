import { useEffect, useRef } from 'react';

export function useSSE() {
  const abortControllerRef = useRef(null);

  const connect = async (url, { method = 'POST', body }, { onMessage, onError, onClose }) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errStr = `HTTP error! status: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error) errStr = errData.error;
        } catch(e) {}
        throw new Error(errStr);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();

        for (const part of parts) {
          if (!part.trim()) continue;
          const lines = part.split('\n');
          let eventData = '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              eventData += line.slice(6);
            } else if (line.startsWith('data:')) {
              eventData += line.slice(5);
            }
          }
          if (eventData) {
            try {
              const parsed = JSON.parse(eventData);
              if (onMessage) onMessage(parsed);
            } catch (e) {
              console.error('SSE parse error:', e, eventData);
            }
          }
        }
      }
      if (onClose) onClose();
    } catch (error) {
      if (error.name === 'AbortError') {
        // silent
      } else {
        if (onError) onError(error);
      }
    }
  };

  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    return () => cancel();
  }, []);

  return { connect, cancel };
}
