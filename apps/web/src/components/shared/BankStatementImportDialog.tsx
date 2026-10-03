'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BANKS } from '@repo/shared/logic';
import { useAccounts } from '@/hooks/useAccounts';
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImportResultSummary, type ImportResult } from '@/components/shared/ImportResultSummary';
import { InstitutionLogo } from '@/components/shared/InstitutionLogo';
import { FileDropzone } from '@/components/shared/FileDropzone';
import { MAX_IMPORT_FILE_SIZE_BYTES } from '@/lib/importLimits';
import { ColumnMapper, BANK_MAPPABLE_FIELDS } from '@/components/shared/ColumnMapper';
import { ImportConfidenceNotice, needsReviewAcknowledgement } from '@/components/shared/ImportConfidenceNotice';
import { DividendReviewList, type DividendRowState } from '@/components/shared/DividendReviewList';
import { useImportDividends } from '@/hooks/useImportDividends';
import { chunkCsv } from '@/lib/chunkCsv';
import { findBank } from '@repo/shared/logic';
import type { DividendEntryInput } from '@repo/shared/schemas';

interface BankStatementImportDialogProps {
  onClose: () => void;
}

/** Same rationale as the generic ImportDialog's COMMIT_CHUNK_SIZE — keeps each commit request
 * inside one serverless function's execution timeout. */
const COMMIT_CHUNK_SIZE = 200;

type Step = 'options' | 'previewing' | 'mapping' | 'preview' | 'committing' | 'partial' | 'done';

const REGIONS = Array.from(new Set(BANKS.map((b) => b.region ?? 'Other')));

export function BankStatementImportDialog({ onClose }: BankStatementImportDialogProps) {
  const queryClient = useQueryClient();
  const { data: accounts } = useAccounts(true);
  const { importDividends } = useImportDividends();
  const [step, setStep] = useState<Step>('options');
  const [bank, setBank] = useState<string>('HDFC');
  const [accountId, setAccountId] = useState<string>('');
  const [csvText, setCsvText] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [remainingChunks, setRemainingChunks] = useState<string[]>([]);
  const [remainingRowOffset, setRemainingRowOffset] = useState(0);
  const [remainingPreviousBalance, setRemainingPreviousBalance] = useState<number | null>(null);
  const [dividendRowState, setDividendRowState] = useState<Record<number, DividendRowState>>({});
  const [dividendSkipRows, setDividendSkipRows] = useState<number[]>([]);

  async function runImport(
    csv: string,
    commit: boolean,
    overrideMapping?: Record<string, string>,
    previousBalance?: number | null,
    dividendSkipRows?: number[]
  ) {
    const res = await fetch('/api/import/bank-statement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        csv,
        bank,
        account_id: accountId,
        commit,
        mapping: overrideMapping,
        previous_balance: previousBalance ?? undefined,
        dividend_skip_rows: dividendSkipRows,
      }),
    });
    const data = await res.json();
    // 422 means "we need your help mapping columns" — a step, not a failure.
    if (res.status === 422 && data.needsMapping) {
      setHeaders(data.headers ?? []);
      setErrorMessage(data.error ?? null);
      setStep('mapping');
      return null;
    }
    if (!res.ok) throw new Error(data.error ?? 'Import failed');
    return data as ImportResult;
  }

  /** Default row state for every newly detected dividend candidate — the linked account
   * defaults to the statement's own account since that's usually where the dividend landed. */
  function initDividendRowState(preview: ImportResult) {
    const next: Record<number, DividendRowState> = {};
    for (const c of preview.dividendCandidates ?? []) {
      next[c.row] = {
        symbol: '',
        exchange: 'NSE',
        linked_account_id: accountId,
        asset_type: 'Stock',
        skipped: false,
      };
    }
    setDividendRowState(next);
  }

  async function handleFile(file: File) {
    if (!accountId) return;
    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      toast.error(`${file.name} is too large — the max import size is 10MB.`);
      return;
    }
    setErrorMessage(null);

    // Some banks' "CSV" export button actually delivers an Excel file (.xlsx/.xls, sometimes
    // even with a .csv extension) — file.text() decodes that binary as garbage text instead of
    // throwing, which used to surface as unreadable "PK□□"-style column names in the mapping
    // step below rather than a clear error. Check the format's real magic bytes first.
    const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    const isZipBased = head[0] === 0x50 && head[1] === 0x4b; // .xlsx/.xls (2007+), also .docx/.zip
    const isLegacyXls = head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0; // .xls (97-2003)
    if (isZipBased || isLegacyXls) {
      toast.error(
        `${file.name} looks like an Excel file, not a CSV. In Excel, use "Save As" → "CSV UTF-8 (Comma delimited)", then upload that file instead.`
      );
      return;
    }

    const text = await file.text();
    setCsvText(text);
    setStep('previewing');
    try {
      const preview = await runImport(text, false);
      if (preview) {
        setResult(preview);
        setReviewAcknowledged(false);
        initDividendRowState(preview);
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
        initDividendRowState(preview);
        setStep('preview');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to parse file');
      setStep('mapping');
    }
  }

  /** Merges one chunk's reconciliation result into the running total. `offset` converts the
   * chunk-local row numbers checkBalanceReconciliation returns (each chunk is parsed as its
   * own file, starting at row 2) back into the original file's row numbers. */
  function mergeReconciliation(
    acc: ImportResult['reconciliation'],
    chunk: ImportResult['reconciliation'],
    offset: number
  ): ImportResult['reconciliation'] {
    if (!chunk) return acc;
    if (!chunk.checkable) return chunk;
    return {
      checkable: true,
      totalChecked: (acc?.totalChecked ?? 0) + chunk.totalChecked,
      mismatches: (acc?.mismatches ?? 0) + chunk.mismatches,
      firstMismatchRow: acc?.firstMismatchRow ?? (chunk.firstMismatchRow !== null ? chunk.firstMismatchRow + offset : null),
      lastBalance: chunk.lastBalance,
    };
  }

  /**
   * Commits `chunks` sequentially, threading the running balance from each chunk's
   * `reconciliation.lastBalance` into the next chunk's `previous_balance` — without this, the
   * self-check would silently lose one comparison at every chunk boundary instead of just the
   * single gap a whole-file import already tolerates. A failure partway through preserves
   * whatever already committed and offers to resume, same as the generic ImportDialog.
   */
  async function commitChunks(
    chunks: string[],
    base: ImportResult,
    rowOffset: number,
    previousBalance: number | null,
    dividendSkipRowsOriginal: number[] = []
  ) {
    let accumulated = base;
    let offset = rowOffset;
    let runningBalance = previousBalance;
    const mappingToSend = Object.keys(mapping).length ? mapping : undefined;

    for (let i = 0; i < chunks.length; i++) {
      setProgress({ done: i, total: chunks.length });
      const chunkRowCount = chunks[i]!.split(/\r\n|\n/).filter((line) => line.length > 0).length - 1;
      // Each chunk is parsed server-side as its own standalone file (see chunkCsv.ts), so its
      // row numbers restart at 2 — translate this chunk's slice of the original file's row
      // numbers (from the whole-file preview) into that chunk-local numbering by subtracting
      // the same `offset` already used to translate error rows back the other way below.
      const localSkipRows = dividendSkipRowsOriginal.map((r) => r - offset).filter((r) => r > 0);
      try {
        const chunkResult = await runImport(chunks[i]!, true, mappingToSend, runningBalance, localSkipRows);
        if (!chunkResult) throw new Error('This file needs column mapping confirmed again before it can commit.');

        accumulated = {
          ...accumulated,
          committed: accumulated.committed + chunkResult.committed,
          errors: [...accumulated.errors, ...chunkResult.errors.map((e) => ({ ...e, row: e.row + offset }))],
          reconciliation: mergeReconciliation(accumulated.reconciliation, chunkResult.reconciliation, offset),
        };
        setResult(accumulated);
        runningBalance = chunkResult.reconciliation?.lastBalance ?? runningBalance;
        offset += chunkRowCount;
      } catch (err) {
        setRemainingChunks(chunks.slice(i));
        setRemainingRowOffset(offset);
        setRemainingPreviousBalance(runningBalance);
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
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['monthlyOverview'] });
    toast.success(`Imported ${accumulated.committed} transaction${accumulated.committed === 1 ? '' : 's'}.`);
  }

  async function handleConfirm() {
    if (!csvText || !result) return;
    setErrorMessage(null);

    const candidates = result.dividendCandidates ?? [];
    const confirmedEntries: DividendEntryInput[] = [];
    const skipRows: number[] = [];
    for (const c of candidates) {
      const state = dividendRowState[c.row];
      if (!state) continue;
      if (state.skipped) {
        skipRows.push(c.row);
      } else {
        confirmedEntries.push({
          date: c.date,
          amount: c.amount,
          symbol: state.symbol.trim(),
          exchange: state.exchange.trim(),
          linked_account_id: state.linked_account_id,
          asset_type: state.asset_type,
        });
      }
    }
    setDividendSkipRows(skipRows);

    if (confirmedEntries.length > 0) {
      setStep('committing');
      try {
        await importDividends(confirmedEntries);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to save dividends');
        setStep('preview');
        return;
      }
    }

    setStep('committing');
    const base: ImportResult = { ...result, committed: 0, errors: [], reconciliation: undefined };
    setResult(base);
    await commitChunks(chunkCsv(csvText, COMMIT_CHUNK_SIZE), base, 0, null, skipRows);
  }

  async function handleRetryRemaining() {
    if (!result) return;
    setErrorMessage(null);
    setStep('committing');
    await commitChunks(remainingChunks, result, remainingRowOffset, remainingPreviousBalance, dividendSkipRows);
  }

  const mappingComplete = !!mapping.date && !!mapping.description && (!!mapping.debit || !!mapping.credit || !!mapping.amount);
  const needsReview =
    !!result &&
    result.mappingSource !== undefined &&
    needsReviewAcknowledgement(result.mappingSource, result.institutionConfidence ?? null);
  const dividendCandidates = result?.dividendCandidates ?? [];
  const dividendRowsValid = dividendCandidates.every((c) => {
    const state = dividendRowState[c.row];
    if (!state) return false;
    return state.skipped || (!!state.symbol.trim() && !!state.exchange.trim() && !!state.linked_account_id);
  });
  const canConfirm =
    !!result &&
    (result.validCount > 0 || dividendCandidates.length > 0) &&
    (!needsReview || reviewAcknowledged) &&
    dividendRowsValid;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Bank Statement</DialogTitle>
          <DialogDescription>
            Upload your bank&apos;s own CSV export as-is — no template needed. Columns are detected
            automatically; if anything is unclear you&apos;ll be asked to map them, so nothing is ever guessed
            silently.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
        {errorMessage && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</p>}

        {step === 'options' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Bank</label>
                <Select value={bank} onValueChange={(v) => setBank(v ?? 'HDFC')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <div key={region}>
                        <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">{region}</p>
                        {BANKS.filter((b) => (b.region ?? 'Other') === region).map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            <InstitutionLogo institutionId={b.id} domain={b.domain} logo={b.logo} />
                            {b.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Account this statement is for</label>
                <Select value={accountId} onValueChange={(v) => setAccountId(v ?? '')}>
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
              disabled={!accountId}
              accept=".csv"
              title="Click to choose your statement file"
              subtitle="CSV export from your bank"
              disabledSubtitle="Select an account first"
            />
          </div>
        )}

        {step === 'previewing' && <p className="text-muted-foreground py-8 text-center text-sm">Reading file…</p>}

        {step === 'mapping' && (
          <ColumnMapper headers={headers} fields={BANK_MAPPABLE_FIELDS} value={mapping} onChange={setMapping} />
        )}

        {step === 'preview' && result && result.mappingSource && (
          <ImportConfidenceNotice
            institutionLabel={findBank(bank)?.label ?? bank}
            mappingSource={result.mappingSource}
            institutionConfidence={result.institutionConfidence ?? null}
            acknowledged={reviewAcknowledged}
            onAcknowledgedChange={setReviewAcknowledged}
          />
        )}

        {step === 'preview' && dividendCandidates.length > 0 && (
          <DividendReviewList
            candidates={dividendCandidates}
            rowState={dividendRowState}
            onChange={(row, next) =>
              setDividendRowState((prev) => ({ ...prev, [row]: { ...prev[row]!, ...next } }))
            }
            accounts={accounts}
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
        </DialogBody>

        <DialogFooter>
          {step === 'mapping' && (
            <Button onClick={handleApplyMapping} disabled={!mappingComplete}>
              Preview with these columns
            </Button>
          )}
          {step === 'preview' && (
            <Button onClick={handleConfirm} disabled={!canConfirm}>
              Confirm Import ({result?.validCount ?? 0} transaction{result?.validCount === 1 ? '' : 's'}
              {dividendCandidates.length > 0 ? `, ${dividendCandidates.length} dividend${dividendCandidates.length === 1 ? '' : 's'}` : ''})
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
