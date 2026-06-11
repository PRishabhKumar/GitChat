import { useState, useCallback } from 'react';
import { useSSE } from './useSSE';
import { useAppContext } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';

export function useChat() {
  const { connect, cancel } = useSSE();
  const { sessionId } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const sendMessage = useCallback((text) => {
    if (!text.trim() || isStreaming) return;

    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    const assistantId = uuidv4();
    const initialAssistantMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      sources: null,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => {
      const newMessages = [...prev, userMessage, initialAssistantMessage];
      const history = prev.slice(-12).map(m => ({ role: m.role, content: m.content }));
      
      setIsStreaming(true);
      setInputValue('');

      connect('/api/chat/message', {
        method: 'POST',
        body: { sessionId, message: text, history }
      }, {
        onMessage: (data) => {
          setMessages(currentMessages => currentMessages.map(m => {
            if (m.id === assistantId) {
              if (data.type === 'sources') {
                return { ...m, sources: data.chunks };
              } else if (data.type === 'token') {
                return { ...m, content: m.content + data.content };
              } else if (data.type === 'done') {
                return { ...m, isStreaming: false };
              } else if (data.type === 'error') {
                return { ...m, error: data.message, isStreaming: false };
              }
            }
            return m;
          }));
          if (data.type === 'done' || data.type === 'error') {
            setIsStreaming(false);
          }
        },
        onError: (err) => {
          setMessages(currentMessages => currentMessages.map(m => 
            m.id === assistantId ? { ...m, error: err.message, isStreaming: false } : m
          ));
          setIsStreaming(false);
        }
      });

      return newMessages;
    });
  }, [isStreaming, connect, sessionId]);

  const clearChat = () => {
    setMessages([]);
    cancel();
    setIsStreaming(false);
  };

  return { messages, isStreaming, sendMessage, clearChat, inputValue, setInputValue };
}
