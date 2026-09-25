'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ImportResultSummary, type ImportResult } from '@/components/shared/ImportResultSummary';
import { FileDropzone } from '@/components/shared/FileDropzone';
import { MAX_IMPORT_FILE_SIZE_BYTES } from '@/lib/importLimits';
import { chunkCsv } from '@/lib/chunkCsv';

interface ImportDialogProps {
  apiPath: string;
  entityLabel: string;
  invalidateQueryKeys: unknown[][];
  assetType?: string;
  onClose: () => void;
}

/** Rows per commit request — keeps each request well inside a serverless function's own
 * execution timeout, chunked client-side rather than via a background job queue (see
 * chunkCsv.ts's doc comment for why). */
const COMMIT_CHUNK_SIZE = 200;

type Step = 'select' | 'previewing' | 'preview' | 'committing' | 'partial' | 'done';

export function ImportDialog({ apiPath, entityLabel, invalidateQueryKeys, assetType: initialAssetType, onClose }: ImportDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('select');
  const [selectedAssetType, setSelectedAssetType] = useState<string>(initialAssetType || 'Stock');
  const [csvText, setCsvText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  // What "Retry remaining" resumes from — only the chunks (and row-number offset) that never
  // successfully committed, not the whole file again.
  const [remainingChunks, setRemainingChunks] = useState<string[]>([]);
  const [remainingRowOffset, setRemainingRowOffset] = useState(0);

  const isInvestmentImport = entityLabel.toLowerCase().includes('investment');

  async function runImport(csv: string, commit: boolean) {
    const res = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv, commit, asset_type: selectedAssetType }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Import failed');
    return data as ImportResult;
  }

  async function handleFile(file: File) {
    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      toast.error(`${file.name} is too large — the max import size is 10MB.`);
      return;
    }
    setErrorMessage(null);

    // A file saved from Excel with a .csv extension is sometimes still a real .xlsx/.xls binary
    // — file.text() decodes that as garbage instead of throwing, which used to surface as a
    // confusing "headers don't match" error instead of telling the user what's actually wrong.
    const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    const isZipBased = head[0] === 0x50 && head[1] === 0x4b; // .xlsx/.xls (2007+), also .docx/.zip
    const isLegacyXls = head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0; // .xls (97-2003)
    if (isZipBased || isLegacyXls) {
      toast.error(
        `${file.name} looks like an Excel file, not a CSV. In Excel, use "Save As" → "CSV UTF-8 (Comma delimited)", then upload that file instead.`
      );
      return;
    }

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

  /**
   * Commits `chunks` sequentially against the same route the old single-request commit used
   * — each chunk is its own independent DB transaction, so a failure partway through leaves
   * everything already committed in place instead of rolling back the whole import. `base` is
   * the running total to add each chunk's outcome onto; `rowOffset` keeps error row numbers
   * meaningful against the original file rather than restarting at 1 for every chunk.
   */
  async function commitChunks(chunks: string[], base: ImportResult, rowOffset: number) {
    let accumulated = base;
    let offset = rowOffset;

    for (let i = 0; i < chunks.length; i++) {
      setProgress({ done: i, total: chunks.length });
      const chunkRowCount = chunks[i]!.split(/\r\n|\n/).filter((line) => line.length > 0).length - 1;
      try {
        const chunkResult = await runImport(chunks[i]!, true);
        accumulated = {
          ...accumulated,
          committed: accumulated.committed + chunkResult.committed,
          errors: [...accumulated.errors, ...chunkResult.errors.map((e) => ({ ...e, row: e.row + offset }))],
        };
        setResult(accumulated);
        offset += chunkRowCount;
      } catch (err) {
        setRemainingChunks(chunks.slice(i));
        setRemainingRowOffset(offset);
        setErrorMessage(
          `Import stopped partway — ${accumulated.committed} row${accumulated.committed === 1 ? '' : 's'} already saved. ${
            err instanceof Error ? err.message : 'That request failed.'
          } The rest weren't touched; retry to pick up where this left off.`
        );
        setStep('partial');
        return;
      }
    }

    setProgress(null);
    setRemainingChunks([]);
    setStep('done');
    invalidateQueryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    toast.success(`Imported ${accumulated.committed} ${entityLabel} row${accumulated.committed === 1 ? '' : 's'}.`);
  }

  async function handleConfirm() {
    if (!csvText || !result) return;
    setErrorMessage(null);
    setStep('committing');
    const base: ImportResult = { ...result, committed: 0, errors: [] };
    setResult(base);
    await commitChunks(chunkCsv(csvText, COMMIT_CHUNK_SIZE), base, 0);
  }

  async function handleRetryRemaining() {
    if (!result) return;
    setErrorMessage(null);
    setStep('committing');
    await commitChunks(remainingChunks, result, remainingRowOffset);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import {entityLabel} from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV filled from the downloaded template. Headers must match exactly.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {isInvestmentImport && step === 'select' && (
            <div className="mb-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                Asset Class
              </label>
              <SegmentedControl
                options={[
                  { value: 'Stock', label: 'Stock' },
                  { value: 'Mutual Fund', label: 'Mutual Fund' },
                  { value: 'ETF', label: 'ETF' },
                  { value: 'Gold', label: 'Gold' },
                ]}
                value={selectedAssetType}
                onChange={setSelectedAssetType}
              />
            </div>
          )}

          {errorMessage && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive mb-3">{errorMessage}</p>
          )}

          {step === 'select' && (
            <FileDropzone
              onFile={handleFile}
              accept=".csv"
              title="Click to choose a CSV file"
              subtitle="or drag and drop"
            />
          )}

          {step === 'previewing' && (
            <p className="text-muted-foreground py-8 text-center text-sm">Reading {fileName}…</p>
          )}

          {(step === 'preview' || step === 'committing' || step === 'partial' || step === 'done') && result && (
            <ImportResultSummary result={result} step={step} />
          )}

          {step === 'committing' && progress && progress.total > 1 && (
            <p className="text-muted-foreground text-xs">
              Importing in batches — {progress.done} of {progress.total} done…
            </p>
          )}
        </DialogBody>

        <DialogFooter>
          {step === 'preview' && (
            <Button onClick={handleConfirm} disabled={!result || result.validCount === 0}>
              Confirm Import ({result?.validCount ?? 0} rows)
            </Button>
          )}
          {step === 'committing' && <Button disabled>Importing…</Button>}
          {step === 'partial' && <Button onClick={handleRetryRemaining}>Retry remaining rows</Button>}
          {step === 'done' && <Button onClick={onClose}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
