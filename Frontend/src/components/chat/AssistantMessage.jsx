import { motion } from 'framer-motion';
import { assistantMessageVariants } from '../../styles/animations';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '../shared/CodeBlock';
import { StreamingCursor } from './StreamingCursor';
import { SourceChunksPanel } from './SourceChunksPanel';
import { TypingIndicator } from './TypingIndicator';

export function AssistantMessage({ message }) {
  if (message.isStreaming && !message.content && !message.sources) {
    return <TypingIndicator />;
  }

  const borderClass = message.error ? 'border-neo-pink' : 'border-neo-black';

  return (
    <motion.div 
      variants={assistantMessageVariants}
      initial="initial"
      animate="animate"
      className="flex self-start max-w-[80%] mt-4 flex-col items-start w-full"
    >
      <span className="font-mono text-xs text-neo-gray uppercase font-bold mb-1 ml-1">GITCHAT</span>
      <div className={`bg-white border-2 ${borderClass} shadow-neo p-4 relative w-full flex flex-col gap-4`} style={{ borderRadius: 0 }}>
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-neo-black text-white flex items-center justify-center border-2 border-neo-black">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
        </div>

        <div className="prose prose-sm max-w-none text-base font-body font-medium">
          {message.error ? (
            <div className="text-neo-pink">{message.error}</div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  if (!inline && match) {
                    return <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />;
                  }
                  return (
                    <code className="bg-neo-cream px-1 border border-neo-black/30 font-mono" {...props}>
                      {children}
                    </code>
                  );
                },
                a({ node, children, ...props }) {
                  return <a target="_blank" rel="noopener noreferrer" className="text-neo-blue underline font-bold hover:text-neo-black transition-colors" {...props}>{children}</a>;
                },
                blockquote({ node, children, ...props }) {
                  return <blockquote className="border-l-4 border-neo-blue bg-blue-50 pl-3 py-1 my-2" {...props}>{children}</blockquote>;
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
          {message.isStreaming && <StreamingCursor />}
        </div>
      </div>

      {message.sources && message.sources.length > 0 && (
        <SourceChunksPanel sources={message.sources} />
      )}
    </motion.div>
  );
}
