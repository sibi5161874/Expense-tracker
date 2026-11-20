export const GROQ_STORAGE_KEY = 'kashmap_groq_api_key';

export function getStoredGroqKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = localStorage.getItem(GROQ_STORAGE_KEY);
    return key && key.trim().length > 0 ? key.trim() : null;
  } catch {
    return null;
  }
}

export function setStoredGroqKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(GROQ_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(GROQ_STORAGE_KEY);
    }
    window.dispatchEvent(new Event('kashmap:groq-key-changed'));
  } catch {
    // Graceful fallback if localStorage is disabled
  }
}

export function removeStoredGroqKey(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GROQ_STORAGE_KEY);
    window.dispatchEvent(new Event('kashmap:groq-key-changed'));
  } catch {
    // Graceful fallback
  }
}
