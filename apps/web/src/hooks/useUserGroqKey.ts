'use client';

import { useSyncExternalStore } from 'react';
import { getStoredGroqKey, setStoredGroqKey, removeStoredGroqKey } from '@/lib/groqStorage';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('kashmap:groq-key-changed', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('kashmap:groq-key-changed', callback);
    window.removeEventListener('storage', callback);
  };
}

export function useUserGroqKey() {
  const groqKey = useSyncExternalStore(
    subscribe,
    getStoredGroqKey,
    () => null
  );

  const isLoaded = true;
  const hasKey = Boolean(groqKey && (groqKey.startsWith('gsk_') || groqKey.length >= 20));

  function setKey(key: string) {
    setStoredGroqKey(key);
  }

  function removeKey() {
    removeStoredGroqKey();
  }

  return {
    groqKey,
    hasKey,
    isLoaded,
    setKey,
    removeKey,
  };
}
