import { useRef, useEffect } from 'react';
import { Button } from '../shared/Button';
import { motion } from 'framer-motion';

export function ChatInput({ value, onChange, onSend, isStreaming }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="w-full bg-white border-t-2 border-neo-black p-4 z-20 shrink-0">
      <div className="max-w-4xl mx-auto relative flex items-end shadow-neo border-2 border-neo-black bg-white" style={{ borderRadius: 0 }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about the repository..."
          disabled={isStreaming}
          rows={1}
          className="w-full bg-transparent p-4 pr-20 font-body text-base focus:outline-none resize-none min-h-[56px] custom-scrollbar"
        />
        <Button
          onClick={onSend}
          disabled={!value.trim() || isStreaming}
          className="absolute right-2 bottom-2 h-10 px-4 text-sm z-10"
        >
          {isStreaming ? (
            <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          )}
        </Button>
      </div>
      <div className="text-center mt-2 text-xs font-mono text-neo-gray uppercase">
        AI can make mistakes. Verify important information.
      </div>
    </div>
  );
}
