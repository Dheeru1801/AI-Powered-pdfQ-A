import { useState, useEffect, useRef } from 'react';

/**
 * Simple typewriter hook - creates character-by-character animation
 * Only animates when shouldAnimate is true
 */
export const useTypewriter = (text, shouldAnimate, speed = 30) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // If we shouldn't animate, just show the full text
    if (!shouldAnimate || !text) {
      setDisplayedText(text || '');
      setIsTyping(false);
      return;
    }

    // Start the typing animation
    setIsTyping(true);
    setDisplayedText('');
    let charIndex = 0;    intervalRef.current = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayedText(text.substring(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(intervalRef.current);
      }
    }, speed);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, shouldAnimate, speed]);

  return { displayedText, isTyping };
};
