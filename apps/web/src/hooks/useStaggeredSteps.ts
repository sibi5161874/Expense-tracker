'use client';

import { useEffect, useState } from 'react';

export interface StaggeredStep {
  label: string;
  /** False while this step's brief "in progress" animation is still playing. */
  settled: boolean;
}

/**
 * Reveals `steps` one at a time (rather than all at once the instant they arrive over SSE) so
 * the step-trace UI reads as a deliberate, staged sequence — each new step shows an "in
 * progress" spinner for `settleDelayMs` before flipping to a checkmark, one step settling at a
 * time even if several arrived back-to-back. `steps` only ever grows by appending (see
 * AiChatWidget's step accumulation), so comparing lengths during render is enough to detect a
 * change — no ref needed (this project's React Compiler forbids reading/writing refs in the
 * render body; see react.dev/learn/you-might-not-need-an-effect for the general pattern).
 */
export function useStaggeredSteps(steps: string[], settleDelayMs = 450): StaggeredStep[] {
  const [revealed, setRevealed] = useState<StaggeredStep[]>([]);

  if (steps.length === 0 && revealed.length > 0) {
    setRevealed([]);
  } else if (revealed.length < steps.length) {
    const newlyAdded = steps.slice(revealed.length).map((label) => ({ label, settled: false }));
    setRevealed([...revealed, ...newlyAdded]);
  }

  useEffect(() => {
    const pendingIndex = revealed.findIndex((s) => !s.settled);
    if (pendingIndex === -1) return;
    const t = setTimeout(() => {
      setRevealed((prev) => prev.map((s, i) => (i === pendingIndex ? { ...s, settled: true } : s)));
    }, settleDelayMs);
    return () => clearTimeout(t);
  }, [revealed, settleDelayMs]);

  return revealed;
}
