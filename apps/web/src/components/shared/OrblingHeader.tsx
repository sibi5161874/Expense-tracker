'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrblingStatus } from '@/components/orbling';
import type { OrblingMood } from '@/hooks/useOrblingMood';

interface OrblingHeaderProps {
  mood: OrblingMood;
  onClose: () => void;
}

/** Chat panel header: the orb's live status line doubles as the typing/thinking indicator. */
export function OrblingHeader({ mood, onClose }: OrblingHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border p-3">
      <div>
        <p className="text-sm font-semibold text-foreground">KashMap Assistant</p>
        <OrblingStatus mood={mood} size={16} heat={false} className="text-xs text-muted-foreground" />
      </div>
      <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close chat">
        <X className="size-4" />
      </Button>
    </div>
  );
}
