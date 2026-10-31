'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { orblingMoodReducer, ORBLING_MOOD_TIMEOUTS, type OrblingMood, type OrblingMoodAction } from '@repo/shared/logic';

export type { OrblingMood };

/**
 * React wiring around the pure orblingMoodReducer: dispatches its actions, and schedules the
 * timed auto-settle transitions (surprised/working/error/watching -> idle) that the reducer
 * itself can't own since it has no concept of time. The orb never goes sleepy on its own before
 * the chat is opened — resting at idle (or watching, on hover) reads much better than a closed
 * launcher that looks like it's dozed off; 'sleepy' is still a real mood (e.g. for the mood
 * showcase), it's just never triggered automatically.
 */
export function useOrblingMood(initial: OrblingMood = 'watching') {
  const [mood, dispatch] = useReducer(orblingMoodReducer, initial);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const act = useCallback((action: OrblingMoodAction) => dispatch(action), []);

  // Auto-settle: surprised/working/error/watching each hold for their own duration, then relax
  // to idle.
  useEffect(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    const ms = ORBLING_MOOD_TIMEOUTS[mood];
    if (ms === undefined) return;
    settleTimer.current = setTimeout(() => dispatch({ type: 'SETTLE' }), ms);
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [mood]);

  return [mood, act] as const;
}
