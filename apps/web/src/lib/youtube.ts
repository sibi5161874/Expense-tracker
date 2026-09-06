/**
 * Converts any of YouTube's link shapes (youtube.com/watch?v=, youtu.be/, or an
 * already-embed youtube.com/embed/ link) into a usable /embed/ URL for an <iframe>. Returns
 * null for a blank string or anything that doesn't parse as a recognizable YouTube link, so
 * callers can hide the video section entirely instead of rendering a broken iframe.
 */
export function toYoutubeEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '');

  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === 'youtube.com') {
    if (parsed.pathname.startsWith('/embed/')) return trimmed;
    const id = parsed.searchParams.get('v');
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  return null;
}
