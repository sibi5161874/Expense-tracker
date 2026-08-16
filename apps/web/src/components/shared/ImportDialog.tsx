'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UploadCloud } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImportResultSummary, type ImportResult } from '@/components/shared/ImportResultSummary';

interface ImportDialogProps {
  apiPath: string;
  entityLabel: string;
  invalidateQueryKeys: unknown[][];
  onClose: () => void;
}

type Step = 'select' | 'previewing' | 'preview' | 'committing' | 'done';

export function ImportDialog({ apiPath, entityLabel, invalidateQueryKeys, onClose }: ImportDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('select');
  const [csvText, setCsvText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runImport(csv: string, commit: boolean) {
    const res = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv, commit }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Import failed');
    return data as ImportResult;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setFileName(file.name);
    const text = await file.text();
    setCsvText(text);
    setStep('previewing');
    try {
      const preview = await runImport(text, false);
      setResult(preview);
      setStep('preview');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to parse file');
      setStep('select');
    }
  }

  async function handleConfirm() {
    if (!csvText) return;
    setStep('committing');
    try {
      const committedResult = await runImport(csvText, true);
      setResult(committedResult);
      setStep('done');
      invalidateQueryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      toast.success(`Imported ${committedResult.committed} ${entityLabel} row${committedResult.committed === 1 ? '' : 's'}.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import {entityLabel} from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV filled from the downloaded template. Headers must match exactly.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</p>
        )}

        {step === 'select' && (
          <label className="border-border/60 hover:bg-muted/40 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center transition-colors">
            <UploadCloud className="text-muted-foreground size-8" />
            <span className="text-sm font-medium">Click to choose a CSV file</span>
            <span className="text-muted-foreground text-xs">or drag and drop</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </label>
        )}

        {step === 'previewing' && (
          <p className="text-muted-foreground py-8 text-center text-sm">Reading {fileName}…</p>
        )}

        {(step === 'preview' || step === 'committing' || step === 'done') && result && (
          <ImportResultSummary result={result} step={step} />
        )}

        <DialogFooter>
          {step === 'preview' && (
            <Button onClick={handleConfirm} disabled={!result || result.validCount === 0}>
              Confirm Import ({result?.validCount ?? 0} rows)
            </Button>
          )}
          {step === 'committing' && <Button disabled>Importing…</Button>}
          {step === 'done' && <Button onClick={onClose}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
