'use client';

import { useEffect, useState } from 'react';
import { getStoredGroqKey, setStoredGroqKey, removeStoredGroqKey } from '@/lib/groqStorage';

export function useUserGroqKey() {
  const [groqKey, setGroqKeyState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setGroqKeyState(getStoredGroqKey());
    setIsLoaded(true);

    const handleKeyChange = () => {
      setGroqKeyState(getStoredGroqKey());
    };

    window.addEventListener('kashmap:groq-key-changed', handleKeyChange);
    window.addEventListener('storage', handleKeyChange);

    return () => {
      window.removeEventListener('kashmap:groq-key-changed', handleKeyChange);
      window.removeEventListener('storage', handleKeyChange);
    };
  }, []);

  const hasKey = Boolean(groqKey && (groqKey.startsWith('gsk_') || groqKey.length >= 20));

  function setKey(key: string) {
    setStoredGroqKey(key);
    setGroqKeyState(key.trim() || null);
  }

  function removeKey() {
    removeStoredGroqKey();
    setGroqKeyState(null);
  }

  return {
    groqKey,
    hasKey,
    isLoaded,
    setKey,
    removeKey,
  };
}
