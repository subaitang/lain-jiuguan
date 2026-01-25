
import React, { useState, useEffect, useRef } from 'react';
import { audio } from '../services/audioEngine';

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  soundEnabled?: boolean;
}

export const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 20, onComplete, soundEnabled = true }) => {
  const [displayedText, setDisplayedText] = useState('');
  const index = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!text.startsWith(displayedText)) {
        setDisplayedText('');
        index.current = 0;
    }
  }, [text]);

  useEffect(() => {
    if (index.current < text.length) {
      const char = text.charAt(index.current);
      
      // Calculate jitter (variation in typing speed)
      let currentDelay = speed;
      if (char === ' ') currentDelay += 40; // Longer pause on spaces
      else if (['.', '!', '?'].includes(char)) currentDelay += 200; // Significant pause on sentence end
      else if (['\n'].includes(char)) currentDelay += 300; // Line breaks take time
      else if ([',', ';', ':'].includes(char)) currentDelay += 100; // Minor pauses
      else currentDelay += (Math.random() * 40 - 20); // Random typing rhythm

      timeoutRef.current = window.setTimeout(() => {
        setDisplayedText((prev) => prev + char);
        index.current++;
        
        if (soundEnabled) {
             let variance = 0;
             
             if (char === ' ') {
                 // Spacebar: Heavier sound (triggered by variance > 50 in engine)
                 variance = -60; 
             } else if (char === '\n') {
                 // Enter: Heaviest sound
                 variance = -80;
             } else if (['.', ',', '!', '?', ';', ':'].includes(char)) {
                 // Punctuation: Lighter, sharper
                 variance = 40 + Math.random() * 10;
             } else if (char.match(/[A-Z]/)) {
                 // Shift key usage simulation (slightly different pitch)
                 variance = 10 + Math.random() * 10;
             } else {
                 // Standard lowercase keys (subtle variance)
                 // Map char code to -20 to +20 range
                 variance = (char.charCodeAt(0) % 40) - 20;
             }

             // Allow sound for spaces and newlines now that we have specific profiles
             if (char.trim() !== '' || char === ' ' || char === '\n') {
                 audio.playTypingSound(variance);
             }
        }
      }, Math.max(10, currentDelay));
    } else if (onComplete && index.current === text.length) {
        onComplete();
    }

    return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [displayedText, text, speed, soundEnabled, onComplete]);

  return <span className="whitespace-pre-wrap">{displayedText}</span>;
};
