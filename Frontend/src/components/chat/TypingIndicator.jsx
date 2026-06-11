import { Loader } from '../shared/Loader';

export function TypingIndicator() {
  return (
    <div className="flex self-start max-w-[80%] msg-enter-left mt-4">
      <div className="bg-white border-2 border-neo-black shadow-neo p-4 relative">
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-neo-black text-white flex items-center justify-center border-2 border-neo-black">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
        </div>
        <Loader size="sm" />
      </div>
    </div>
  );
}
