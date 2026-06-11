import { useRef, useEffect } from 'react';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { SystemMessage } from './SystemMessage';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { ScrollToBottomBtn } from './ScrollToBottomBtn';

export function MessageList({ messages, isStreaming }) {
  const containerRef = useRef(null);
  
  const lastMessage = messages[messages.length - 1];
  const scrollDep = lastMessage ? `${messages.length}-${lastMessage.content.length}` : '0-0';

  const { showScrollButton, newMessageWhileScrolledUp, scrollToBottom } = useAutoScroll(containerRef, [scrollDep, isStreaming]);

  return (
    <div className="relative flex-1 overflow-hidden w-full flex flex-col">
      <div 
        ref={containerRef} 
        className="flex-1 overflow-y-auto px-4 md:px-8 pb-32 pt-8 w-full max-w-4xl mx-auto custom-scrollbar flex flex-col"
      >
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return <UserMessage key={msg.id} message={msg} />;
          } else if (msg.role === 'assistant') {
            return <AssistantMessage key={msg.id} message={msg} />;
          } else if (msg.role === 'system') {
            return <SystemMessage key={msg.id} message={msg} />;
          }
          return null;
        })}
      </div>
      
      <ScrollToBottomBtn 
        show={showScrollButton} 
        onClick={scrollToBottom} 
        hasNewMessage={newMessageWhileScrolledUp} 
      />
    </div>
  );
}
