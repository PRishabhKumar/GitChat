import { useChat } from '../../hooks/useChat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { SuggestedQuestions } from './SuggestedQuestions';
import { useAppContext } from '../../context/AppContext';

export function ChatView() {
  const { messages, isStreaming, sendMessage, inputValue, setInputValue } = useChat();

  return (
    <div className="flex flex-col h-full w-full bg-neo-cream relative">
      <div className="landing-grid-bg absolute inset-0 z-0 opacity-50"></div>
      
      {messages.length === 0 ? (
        <div className="flex-1 z-10">
          <SuggestedQuestions onSelect={(q) => sendMessage(q)} />
        </div>
      ) : (
        <div className="flex-1 z-10 flex flex-col overflow-hidden">
          <MessageList messages={messages} isStreaming={isStreaming} />
        </div>
      )}

      <ChatInput 
        value={inputValue}
        onChange={setInputValue}
        onSend={() => sendMessage(inputValue)}
        isStreaming={isStreaming}
      />
    </div>
  );
}
