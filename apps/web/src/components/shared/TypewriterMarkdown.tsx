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

  // Reset the typewriter state the moment `content` or `animate` changes, using React's
  // documented "adjusting state when a prop changes" pattern (comparing against the
  // last-seen props during render) rather than an effect — this is the same technique
  // Sidebar.tsx uses, and it keeps the reset synchronous with the render that introduces
  // the new content instead of flashing the old text for one frame first.
  const [lastContent, setLastContent] = useState(content);
  const [lastAnimate, setLastAnimate] = useState(animate);
  if (content !== lastContent || animate !== lastAnimate) {
    setLastContent(content);
    setLastAnimate(animate);
    setDisplayedLength(animate ? 0 : content.length);
    setIsDone(!animate);
  }

  useEffect(() => {
    if (!animate) return;

    // If already at full length, mark done. This observes state the interval below already
    // reached in a prior run of this effect (or a 0-length content), so it's reporting
    // completion to an external callback, not deriving render state — a legitimate effect use.
    if (displayedLength >= content.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
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
  }, [content, animate, speed, displayedLength]);

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
