import { describe, expect, it } from 'vitest';
import { toYoutubeEmbedUrl } from './youtube';

describe('toYoutubeEmbedUrl', () => {
  it('converts a standard watch?v= link', () => {
    expect(toYoutubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('converts a youtu.be short link', () => {
    expect(toYoutubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('passes through an already-embed link unchanged', () => {
    expect(toYoutubeEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('keeps extra query params off a watch link when converting', () => {
    expect(toYoutubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('returns null for an empty string', () => {
    expect(toYoutubeEmbedUrl('')).toBeNull();
  });

  it('returns null for a blank/whitespace-only string', () => {
    expect(toYoutubeEmbedUrl('   ')).toBeNull();
  });

  it('returns null for a non-YouTube URL', () => {
    expect(toYoutubeEmbedUrl('https://vimeo.com/12345')).toBeNull();
  });

  it('returns null for a malformed URL', () => {
    expect(toYoutubeEmbedUrl('not a url')).toBeNull();
  });

  it('returns null for a youtube.com link with no video id', () => {
    expect(toYoutubeEmbedUrl('https://www.youtube.com/')).toBeNull();
  });
});
