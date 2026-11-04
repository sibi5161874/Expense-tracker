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
 * The always-present launcher orb, bottom-right on every authenticated page.
 * Kept compact on mobile (bottom-20, right-3) so it sits cleanly above the bottom nav
 * without overlapping table rows or action controls.
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
      className="fixed right-4 bottom-[calc(64px+env(safe-area-inset-bottom,0px)+12px)] z-30 flex size-12 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:right-6 md:bottom-6 md:size-14"
    >
      <Orbling mood={mood} size={48} palette={palette} heat label="KashMap Assistant" />
    </motion.button>
  );
}
