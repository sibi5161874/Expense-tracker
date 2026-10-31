import { describe, expect, it } from 'vitest';
import { orblingMoodReducer, type OrblingMood } from './orblingMoodMachine';

describe('orblingMoodReducer', () => {
  it('goes to surprised on tap, then idle once opened', () => {
    let mood: OrblingMood = 'watching';
    mood = orblingMoodReducer(mood, { type: 'TAP' });
    expect(mood).toBe('surprised');
    mood = orblingMoodReducer(mood, { type: 'OPENED' });
    expect(mood).toBe('idle');
  });

  it('returns to idle (not watching) when the chat panel closes', () => {
    expect(orblingMoodReducer('typing', { type: 'CLOSED' })).toBe('idle');
  });

  it('wakes to watching on hover, only from idle or sleepy, and settles back to idle', () => {
    expect(orblingMoodReducer('idle', { type: 'HOVERED' })).toBe('watching');
    expect(orblingMoodReducer('sleepy', { type: 'HOVERED' })).toBe('watching');
    expect(orblingMoodReducer('typing', { type: 'HOVERED' })).toBe('typing');
    expect(orblingMoodReducer('watching', { type: 'SETTLE' })).toBe('idle');
  });

  it('switches to typing while the input has text, and back to idle once empty', () => {
    let mood: OrblingMood = 'idle';
    mood = orblingMoodReducer(mood, { type: 'INPUT_CHANGED', hasText: true });
    expect(mood).toBe('typing');
    mood = orblingMoodReducer(mood, { type: 'INPUT_CHANGED', hasText: false });
    expect(mood).toBe('idle');
  });

  it('does not leave a non-typing mood just because input is cleared', () => {
    expect(orblingMoodReducer('reading', { type: 'INPUT_CHANGED', hasText: false })).toBe('reading');
  });

  it('runs the full send -> stream -> settle lifecycle', () => {
    let mood: OrblingMood = 'typing';
    mood = orblingMoodReducer(mood, { type: 'SEND' });
    expect(mood).toBe('thinking');
    mood = orblingMoodReducer(mood, { type: 'FIRST_TOKEN' });
    expect(mood).toBe('reading');
    mood = orblingMoodReducer(mood, { type: 'STREAM_DONE' });
    expect(mood).toBe('working');
    mood = orblingMoodReducer(mood, { type: 'SETTLE' });
    expect(mood).toBe('idle');
  });

  it('goes to error on a failed request and settles back to idle', () => {
    let mood: OrblingMood = 'thinking';
    mood = orblingMoodReducer(mood, { type: 'ERROR' });
    expect(mood).toBe('error');
    mood = orblingMoodReducer(mood, { type: 'SETTLE' });
    expect(mood).toBe('idle');
  });

  it('ignores a stray SETTLE for a mood that is not transient', () => {
    expect(orblingMoodReducer('typing', { type: 'SETTLE' })).toBe('typing');
    expect(orblingMoodReducer('reading', { type: 'SETTLE' })).toBe('reading');
    expect(orblingMoodReducer('thinking', { type: 'SETTLE' })).toBe('thinking');
  });

  it('goes sleepy only from idle, and wakes on any interaction', () => {
    expect(orblingMoodReducer('idle', { type: 'WENT_SLEEPY' })).toBe('sleepy');
    expect(orblingMoodReducer('typing', { type: 'WENT_SLEEPY' })).toBe('typing');
    expect(orblingMoodReducer('sleepy', { type: 'INTERACTED' })).toBe('idle');
    expect(orblingMoodReducer('idle', { type: 'INTERACTED' })).toBe('idle');
  });
});
