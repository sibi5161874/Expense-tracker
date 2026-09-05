'use client';

import { Info, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in the destructive style. Defaults to true since every
   * current caller is a delete confirmation. */
  destructive?: boolean;
  onConfirm: () => void;
  isConfirming?: boolean;
  confirmingLabel?: string;
}

/**
 * Shared replacement for the native `confirm()` dialog used across the delete-confirmation
 * call sites in this app — a real, styled, focus-trapped modal instead of a blocking browser
 * prompt that can't be styled, isn't reliably drivable by Playwright, and looks jarring next
 * to the rest of the design system.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  isConfirming = false,
  confirmingLabel = 'Deleting…',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full',
                destructive ? 'bg-destructive/10 text-destructive' : 'bg-info/10 text-info'
              )}
            >
              {destructive ? <Trash2 className="size-4" /> : <Info className="size-4" />}
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && <DialogDescription className="pl-12">{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="sm:flex-row sm:justify-stretch">
          <Button className="flex-1" variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button
            className="flex-1"
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? confirmingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
