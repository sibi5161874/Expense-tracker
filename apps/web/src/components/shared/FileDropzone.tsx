'use client';

import { useState, type ChangeEvent, type DragEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  accept?: string;
  title: string;
  subtitle: string;
  /** Shown instead of `subtitle` while `disabled` — e.g. "Select an account first". */
  disabledSubtitle?: string;
}

/**
 * Shared file-picker used by every CSV/statement import dialog. Previously each dialog was a
 * `<label>` styled to look like a dropzone (with "or drag and drop" text) but with no drag
 * event handlers at all — only the click-to-browse path actually worked. This wires real
 * `onDragOver`/`onDrop` handlers so drag-and-drop does what the label already claimed to do.
 */
export function FileDropzone({ onFile, disabled, accept = '.csv', title, subtitle, disabledSubtitle }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    // Reset so choosing the same file again (e.g. after fixing it and re-exporting under the
    // same name) still fires a change event instead of being a no-op.
    e.target.value = '';
  }

  function handleDragOver(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center transition-colors',
        disabled ? 'border-border/60 cursor-not-allowed opacity-50' : 'border-border/60 hover:bg-muted/40 cursor-pointer',
        isDragOver && !disabled && 'border-primary bg-primary/5'
      )}
    >
      <UploadCloud className="text-muted-foreground size-8" />
      <span className="text-sm font-medium">{title}</span>
      <span className="text-muted-foreground text-xs">{disabled && disabledSubtitle ? disabledSubtitle : subtitle}</span>
      <input type="file" accept={accept} className="hidden" disabled={disabled} onChange={handleChange} />
    </label>
  );
}
