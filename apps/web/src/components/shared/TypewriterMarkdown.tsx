'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AiMarkdown } from './AiMarkdown';

interface TypewriterMarkdownProps {
  content: string;
  animate?: boolean;
  speed?: number; // ms per char
  onProgress?: () => void;
  onComplete?: () => void;
  className?: string;
}

/**
 * Renders Markdown content with a smooth typewriter character-by-character reveal effect.
 * Automatically scrolls as new characters are typed.
 */
export function TypewriterMarkdown({
  content,
  animate = true,
  speed = 12,
  onProgress,
  onComplete,
  className,
}: TypewriterMarkdownProps) {
  const [displayedLength, setDisplayedLength] = useState(animate ? 0 : content.length);
  const [isDone, setIsDone] = useState(!animate);
  const progressRef = useRef(onProgress);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    progressRef.current = onProgress;
    completeRef.current = onComplete;
  }, [onProgress, onComplete]);

  useEffect(() => {
    if (!animate) {
      setDisplayedLength(content.length);
      setIsDone(true);
      return;
    }

    // If already at full length, mark done
    if (displayedLength >= content.length) {
      setIsDone(true);
      completeRef.current?.();
      return;
    }

    // Dynamic speed adjustment for longer texts so the user isn't waiting too long
    // Base step size increases if content is long
    const stepSize = content.length > 500 ? 3 : content.length > 200 ? 2 : 1;

    const interval = setInterval(() => {
      setDisplayedLength((prev) => {
        const next = Math.min(prev + stepSize, content.length);
        if (next >= content.length) {
          clearInterval(interval);
          setIsDone(true);
          completeRef.current?.();
        }
        progressRef.current?.();
        return next;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [content, animate, speed]);

  const displayedContent = content.slice(0, displayedLength);

  return (
    <div
      className="relative group cursor-text"
      onClick={() => {
        // Allow user to click to instantly complete typewriter animation
        if (!isDone) {
          setDisplayedLength(content.length);
          setIsDone(true);
          completeRef.current?.();
        }
      }}
      title={!isDone ? 'Click to show all text' : undefined}
    >
      <AiMarkdown content={displayedContent} className={className} />
      {!isDone && (
        <span className="inline-block w-1.5 h-3.5 bg-primary rounded-full animate-pulse ml-1 align-middle translate-y-[-1px]" />
      )}
    </div>
  );
}
