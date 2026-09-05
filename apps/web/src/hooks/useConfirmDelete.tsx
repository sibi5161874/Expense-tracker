'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

/**
 * Replaces the `if (confirm('...')) onDelete(id)` pattern with a real dialog in three lines
 * per call site instead of ~15 (a local `useState` + a full `<ConfirmDialog>` render block) —
 * built once here so the 20+ delete-confirmation sites across asset cards, settings rows, and
 * list pages don't each hand-roll the same open/pending/onConfirm wiring.
 */
export function useConfirmDelete<T>(onConfirm: (item: T) => void, title: string, description?: string) {
  const [pending, setPending] = useState<T | null>(null);

  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) setPending(null);
      }}
      title={title}
      description={description}
      onConfirm={() => {
        if (pending !== null) onConfirm(pending);
        setPending(null);
      }}
    />
  );

  return { requestDelete: setPending, dialog };
}
