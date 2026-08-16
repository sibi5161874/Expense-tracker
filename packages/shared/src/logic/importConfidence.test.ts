import { describe, expect, it } from 'vitest';
import { needsReviewAcknowledgement } from './importConfidence';

describe('needsReviewAcknowledgement', () => {
  it('does not require review for an exact match against a verified institution', () => {
    expect(needsReviewAcknowledgement('exact', 'verified')).toBe(false);
  });

  it('requires review for an exact match against a merely partial-confidence institution', () => {
    expect(needsReviewAcknowledgement('exact', 'partial')).toBe(true);
  });

  it('requires review whenever the mapping came from heuristics, even against a verified institution', () => {
    // Shouldn't happen in practice (a verified institution matches exactly),
    // but if it ever does, heuristic detection should never be silently trusted.
    expect(needsReviewAcknowledgement('heuristic', 'verified')).toBe(true);
  });

  it('requires review for a heuristic-confidence institution', () => {
    expect(needsReviewAcknowledgement('heuristic', 'heuristic')).toBe(true);
  });

  it('requires review for a manually-typed mapping regardless of institution', () => {
    expect(needsReviewAcknowledgement('manual', 'verified')).toBe(true);
    expect(needsReviewAcknowledgement('manual', null)).toBe(true);
  });

  it('requires review when no institution was matched at all', () => {
    expect(needsReviewAcknowledgement('heuristic', null)).toBe(true);
  });
});
