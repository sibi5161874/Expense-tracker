import { describe, expect, it, beforeEach, vi } from 'vitest';
import { getStoredGroqKey, setStoredGroqKey, removeStoredGroqKey, GROQ_STORAGE_KEY } from './groqStorage';

describe('groqStorage', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      length: store.size,
      key: () => null,
    };
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('localStorage', mockStorage);
  });

  it('returns null when no key is stored', () => {
    expect(getStoredGroqKey()).toBeNull();
  });

  it('stores and retrieves a valid trimmed groq key', () => {
    setStoredGroqKey('  gsk_test1234567890abcdef  ');
    expect(getStoredGroqKey()).toBe('gsk_test1234567890abcdef');
    expect(store.get(GROQ_STORAGE_KEY)).toBe('gsk_test1234567890abcdef');
  });

  it('removes the key when empty string is passed to setStoredGroqKey', () => {
    setStoredGroqKey('gsk_test123');
    expect(getStoredGroqKey()).toBe('gsk_test123');
    setStoredGroqKey('   ');
    expect(getStoredGroqKey()).toBeNull();
  });

  it('removes the key via removeStoredGroqKey', () => {
    setStoredGroqKey('gsk_test123');
    removeStoredGroqKey();
    expect(getStoredGroqKey()).toBeNull();
  });
});
