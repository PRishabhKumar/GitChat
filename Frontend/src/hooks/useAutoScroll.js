import { useState, useEffect, useRef } from 'react';

export function useAutoScroll(containerRef, deps) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessageWhileScrolledUp, setNewMessageWhileScrolledUp] = useState(false);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distanceToBottom < 50;

    setIsAtBottom(atBottom);
    
    if (atBottom) {
      setShowScrollButton(false);
      setNewMessageWhileScrolledUp(false);
    } else {
      setShowScrollButton(true);
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [containerRef]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    if (isAtBottom) {
      scrollToBottom();
    } else {
      setNewMessageWhileScrolledUp(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setIsAtBottom(true);
      setShowScrollButton(false);
      setNewMessageWhileScrolledUp(false);
    }
  };

  return { isAtBottom, showScrollButton, newMessageWhileScrolledUp, scrollToBottom };
}
