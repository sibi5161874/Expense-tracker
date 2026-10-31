'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

/** "night" in dark mode, "sky" otherwise — gated by a mounted flag to avoid a server/client
 * hydration mismatch, same pattern as ThemeToggle.tsx. */
export function useOrblingPalette(): 'sky' | 'night' {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- avoids a server/client hydration mismatch, see ThemeToggle.tsx
    setMounted(true);
  }, []);

  return mounted && resolvedTheme === 'dark' ? 'night' : 'sky';
}
