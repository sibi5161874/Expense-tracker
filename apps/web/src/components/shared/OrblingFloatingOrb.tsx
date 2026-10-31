'use client';

import { motion } from 'framer-motion';
import { Orbling } from '@/components/orbling';
import type { OrblingMood } from '@/hooks/useOrblingMood';
import { useOrblingPalette } from '@/hooks/useOrblingPalette';

interface OrblingFloatingOrbProps {
  mood: OrblingMood;
  isOpen: boolean;
  onTap: () => void;
  onCloseTap: () => void;
  onHover: () => void;
}

/**
 * The always-present launcher orb, bottom-right on every authenticated page (rendered once
 * from AppShell, which already persists across route changes within the (app) layout — no
 * separate layout.tsx mount needed). Stays visible even while the chat panel is open — tapping
 * it then just closes the panel instead of opening it again. Rests at "idle" until hovered,
 * which wakes it to "watching" for 90s (see ORBLING_MOOD_TIMEOUTS) — it doesn't track the
 * cursor constantly, only after you've actually noticed it. Quick press-shrink and a visible
 * "surprised" reaction on tap.
 */
export function OrblingFloatingOrb({ mood, isOpen, onTap, onCloseTap, onHover }: OrblingFloatingOrbProps) {
  const palette = useOrblingPalette();

  return (
    <motion.button
      type="button"
      onClick={isOpen ? onCloseTap : onTap}
      onMouseEnter={onHover}
      whileTap={{ scale: 0.95 }}
      aria-label={isOpen ? 'Close KashMap Assistant' : 'Open KashMap Assistant'}
      className="fixed bottom-4 right-4 z-50 flex size-14 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:bottom-6 sm:right-6"
    >
      <Orbling mood={mood} size={56} palette={palette} heat label="KashMap Assistant" />
    </motion.button>
  );
}
