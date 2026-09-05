'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BROKERS } from '@repo/shared/logic';
import { useAccounts } from '@/hooks/useAccounts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImportResultSummary, type ImportResult } from '@/components/shared/ImportResultSummary';
import { FileDropzone } from '@/components/shared/FileDropzone';
import { MAX_IMPORT_FILE_SIZE_BYTES } from '@/lib/importLimits';
import { ColumnMapper, BROKER_MAPPABLE_FIELDS } from '@/components/shared/ColumnMapper';
import { ImportConfidenceNotice, needsReviewAcknowledgement } from '@/components/shared/ImportConfidenceNotice';
import { chunkCsv } from '@/lib/chunkCsv';
import { findBroker } from '@repo/shared/logic';

interface BrokerImportDialogProps {
  onClose: () => void;
}

/** Same rationale as the generic ImportDialog's COMMIT_CHUNK_SIZE — keeps each commit request
 * inside one serverless function's execution timeout. No reconciliation self-check exists for
 * broker imports (trades have no running balance column), so unlike bank-statement import this
 * needed no chunk-aware state to thread through — it's a direct mirror of the generic dialog. */
const COMMIT_CHUNK_SIZE = 200;

type Step = 'options' | 'previewing' | 'mapping' | 'preview' | 'committing' | 'partial' | 'done';

export function BrokerImportDialog({ onClose }: BrokerImportDialogProps) {
  const queryClient = useQueryClient();
  const { data: accounts } = useAccounts(true);
  const [step, setStep] = useState<Step>('options');
  const [broker, setBroker] = useState<string>('ZERODHA');
  const [linkedAccountId, setLinkedAccountId] = useState<string>('');
  const [csvText, setCsvText] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [remainingChunks, setRemainingChunks] = useState<string[]>([]);
  const [remainingRowOffset, setRemainingRowOffset] = useState(0);

  async function runImport(csv: string, commit: boolean, overrideMapping?: Record<string, string>) {
    const res = await fetch('/api/import/broker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv, broker, linked_account_id: linkedAccountId, commit, mapping: overrideMapping }),
    });
    const data = await res.json();
    if (res.status === 422 && data.needsMapping) {
      setHeaders(data.headers ?? []);
      setErrorMessage(data.error ?? null);
      setStep('mapping');
      return null;
    }
    if (!res.ok) throw new Error(data.error ?? 'Import failed');
    return data as ImportResult;
  }

  async function handleFile(file: File) {
    if (!linkedAccountId) return;
    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      toast.error(`${file.name} is too large — the max import size is 10MB.`);
      return;
    }
    setErrorMessage(null);
    const text = await file.text();
    setCsvText(text);
    setStep('previewing');
    try {
      const preview = await runImport(text, false);
      if (preview) {
        setResult(preview);
        setReviewAcknowledged(false);
        setStep('preview');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to parse file');
      setStep('options');
    }
  }

  async function handleApplyMapping() {
    if (!csvText) return;
    setErrorMessage(null);
    setStep('previewing');
    try {
      const preview = await runImport(csvText, false, mapping);
      if (preview) {
        setResult(preview);
        setStep('preview');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to parse file');
      setStep('mapping');
    }
  }

  /** Commits `chunks` sequentially — each an independent DB transaction, so a failure partway
   * through leaves already-committed rows in place instead of losing the whole import. Mirrors
   * the generic ImportDialog's commitChunks; see BankStatementImportDialog for the variant that
   * also has to thread reconciliation state across chunks. */
  async function commitChunks(chunks: string[], base: ImportResult, rowOffset: number) {
    let accumulated = base;
    let offset = rowOffset;
    const mappingToSend = Object.keys(mapping).length ? mapping : undefined;

    for (let i = 0; i < chunks.length; i++) {
      setProgress({ done: i, total: chunks.length });
      const chunkRowCount = chunks[i]!.split(/\r\n|\n/).filter((line) => line.length > 0).length - 1;
      try {
        const chunkResult = await runImport(chunks[i]!, true, mappingToSend);
        if (!chunkResult) throw new Error('This file needs column mapping confirmed again before it can commit.');

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
          `Import stopped partway — ${accumulated.committed} trade${accumulated.committed === 1 ? '' : 's'} already saved. ${
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
    queryClient.invalidateQueries({ queryKey: ['investmentLog'] });
    queryClient.invalidateQueries({ queryKey: ['allInvestmentLog'] });
    queryClient.invalidateQueries({ queryKey: ['holdings'] });
    toast.success(`Imported ${accumulated.committed} trade${accumulated.committed === 1 ? '' : 's'}.`);
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

  const mappingComplete = ['date', 'symbol', 'tradeType', 'quantity', 'price'].every((f) => !!mapping[f]);
  const needsReview =
    !!result &&
    result.mappingSource !== undefined &&
    needsReviewAcknowledgement(result.mappingSource, result.institutionConfidence ?? null);
  const canConfirm = !!result && result.validCount > 0 && (!needsReview || reviewAcknowledged);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import from Broker</DialogTitle>
          <DialogDescription>
            Upload your broker&apos;s own tradebook export as-is — no template needed. Columns are detected
            automatically; if anything is unclear you&apos;ll be asked to map them, so nothing is ever guessed
            silently.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 min-h-0 flex-1 space-y-4 overflow-y-auto px-4">
        {errorMessage && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</p>}

        {step === 'options' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Broker</label>
                <Select value={broker} onValueChange={(v) => setBroker(v ?? 'ZERODHA')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BROKERS.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Linked Account</label>
                <Select value={linkedAccountId} onValueChange={(v) => setLinkedAccountId(v ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} ({a.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <FileDropzone
              onFile={handleFile}
              disabled={!linkedAccountId}
              accept=".csv"
              title="Click to choose your tradebook file"
              subtitle="CSV export from your broker"
              disabledSubtitle="Select a linked account first"
            />
          </div>
        )}

        {step === 'previewing' && <p className="text-muted-foreground py-8 text-center text-sm">Reading file…</p>}

        {step === 'mapping' && (
          <ColumnMapper headers={headers} fields={BROKER_MAPPABLE_FIELDS} value={mapping} onChange={setMapping} />
        )}

        {step === 'preview' && result && result.mappingSource && (
          <ImportConfidenceNotice
            institutionLabel={findBroker(broker)?.label ?? broker}
            mappingSource={result.mappingSource}
            institutionConfidence={result.institutionConfidence ?? null}
            acknowledged={reviewAcknowledged}
            onAcknowledgedChange={setReviewAcknowledged}
          />
        )}

        {(step === 'preview' || step === 'committing' || step === 'partial' || step === 'done') && result && (
          <ImportResultSummary result={result} step={step} />
        )}

        {step === 'committing' && progress && progress.total > 1 && (
          <p className="text-muted-foreground text-xs">
            Importing in batches — {progress.done} of {progress.total} done…
          </p>
        )}
        </div>

        <DialogFooter>
          {step === 'mapping' && (
            <Button onClick={handleApplyMapping} disabled={!mappingComplete}>
              Preview with these columns
            </Button>
          )}
          {step === 'preview' && (
            <Button onClick={handleConfirm} disabled={!canConfirm}>
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
