export type OrblingMood =
  | 'idle'
  | 'thinking'
  | 'reading'
  | 'typing'
  | 'working'
  | 'waiting'
  | 'watching'
  | 'surprised'
  | 'sleepy'
  | 'error';

export type OrblingMoodAction =
  | { type: 'TAP' }
  | { type: 'OPENED' }
  | { type: 'CLOSED' }
  | { type: 'HOVERED' }
  | { type: 'INPUT_CHANGED'; hasText: boolean }
  | { type: 'SEND' }
  | { type: 'FIRST_TOKEN' }
  | { type: 'STREAM_DONE' }
  | { type: 'ERROR' }
  | { type: 'SETTLE' }
  | { type: 'INTERACTED' }
  | { type: 'WENT_SLEEPY' };

/**
 * Pure transition table for the AI assistant orb's mood, driven by chat lifecycle events.
 * Kept framework-agnostic (no timers, no React) so the state transitions are unit-testable on
 * their own; the time-based transitions (surprised -> idle after 400ms, working -> idle after
 * 800ms, error -> idle after 3s, watching -> idle after 90s) are scheduled by the caller
 * (apps/web's useOrblingMood hook) via setTimeout, which then dispatches 'SETTLE'. The orb never
 * goes sleepy on its own — WENT_SLEEPY/INTERACTED exist for callers that want that (e.g. a mood
 * showcase), but nothing in this app auto-triggers them; a closed, "dozed off" launcher is bad
 * UX.
 */
export function orblingMoodReducer(mood: OrblingMood, action: OrblingMoodAction): OrblingMood {
  switch (action.type) {
    case 'TAP':
      return 'surprised';
    case 'OPENED':
      return 'idle';
    case 'CLOSED':
      return 'idle';
    case 'HOVERED':
      // Only hovering the closed launcher wakes it to "watching" — it rests at idle otherwise,
      // and this never interrupts an actual chat in progress.
      return mood === 'idle' || mood === 'sleepy' ? 'watching' : mood;
    case 'INPUT_CHANGED':
      if (action.hasText) return 'typing';
      return mood === 'typing' ? 'idle' : mood;
    case 'SEND':
      return 'thinking';
    case 'FIRST_TOKEN':
      return 'reading';
    case 'STREAM_DONE':
      return 'working';
    case 'ERROR':
      return 'error';
    case 'SETTLE':
      // Only the moods that are meant to be transient settle back to idle on a timer; a mood
      // reached through some other path (e.g. typing, reading) ignores a stray SETTLE.
      return mood === 'surprised' || mood === 'working' || mood === 'error' || mood === 'watching'
        ? 'idle'
        : mood;
    case 'INTERACTED':
      return mood === 'sleepy' ? 'idle' : mood;
    case 'WENT_SLEEPY':
      return mood === 'idle' ? 'sleepy' : mood;
    default:
      return mood;
  }
}

/** Milliseconds for each mood's auto-settle timer; moods not listed hold until an explicit action. */
export const ORBLING_MOOD_TIMEOUTS: Partial<Record<OrblingMood, number>> = {
  surprised: 400,
  working: 800,
  error: 3000,
  watching: 90_000,
};
