'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UploadCloud } from 'lucide-react';
import { BANKS } from '@repo/shared/logic';
import { useAccounts } from '@/hooks/useAccounts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImportResultSummary, type ImportResult } from '@/components/shared/ImportResultSummary';
import { ColumnMapper, BANK_MAPPABLE_FIELDS } from '@/components/shared/ColumnMapper';
import { ImportConfidenceNotice, needsReviewAcknowledgement } from '@/components/shared/ImportConfidenceNotice';
import { findBank } from '@repo/shared/logic';

interface BankStatementImportDialogProps {
  onClose: () => void;
}

type Step = 'options' | 'previewing' | 'mapping' | 'preview' | 'committing' | 'done';

const REGIONS = Array.from(new Set(BANKS.map((b) => b.region ?? 'Other')));

export function BankStatementImportDialog({ onClose }: BankStatementImportDialogProps) {
  const queryClient = useQueryClient();
  const { data: accounts } = useAccounts(true);
  const [step, setStep] = useState<Step>('options');
  const [bank, setBank] = useState<string>('HDFC');
  const [accountId, setAccountId] = useState<string>('');
  const [csvText, setCsvText] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);

  async function runImport(csv: string, commit: boolean, overrideMapping?: Record<string, string>) {
    const res = await fetch('/api/import/bank-statement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv, bank, account_id: accountId, commit, mapping: overrideMapping }),
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !accountId) return;
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

  async function handleConfirm() {
    if (!csvText) return;
    setStep('committing');
    try {
      const committed = await runImport(csvText, true, Object.keys(mapping).length ? mapping : undefined);
      if (!committed) return;
      setResult(committed);
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyOverview'] });
      toast.success(`Imported ${committed.committed} transaction${committed.committed === 1 ? '' : 's'}.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    }
  }

  const mappingComplete = !!mapping.date && !!mapping.description && (!!mapping.debit || !!mapping.credit || !!mapping.amount);
  const needsReview =
    !!result &&
    result.mappingSource !== undefined &&
    needsReviewAcknowledgement(result.mappingSource, result.institutionConfidence ?? null);
  const canConfirm = !!result && result.validCount > 0 && (!needsReview || reviewAcknowledged);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Bank Statement</DialogTitle>
          <DialogDescription>
            Upload your bank&apos;s own CSV export as-is — no template needed. Columns are detected
            automatically; if anything is unclear you&apos;ll be asked to map them, so nothing is ever guessed
            silently.
          </DialogDescription>
        </DialogHeader>

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

            <label
              className={`border-border/60 flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center transition-colors ${
                accountId ? 'hover:bg-muted/40 cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
            >
              <UploadCloud className="text-muted-foreground size-8" />
              <span className="text-sm font-medium">Click to choose your statement file</span>
              <span className="text-muted-foreground text-xs">
                {accountId ? 'CSV export from your bank' : 'Select an account first'}
              </span>
              <input type="file" accept=".csv" className="hidden" disabled={!accountId} onChange={handleFileChange} />
            </label>
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

        {(step === 'preview' || step === 'committing' || step === 'done') && result && (
          <ImportResultSummary result={result} step={step} />
        )}

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
          {step === 'done' && <Button onClick={onClose}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
