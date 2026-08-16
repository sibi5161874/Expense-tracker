'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UploadCloud } from 'lucide-react';
import { BROKERS } from '@repo/shared/logic';
import { useAccounts } from '@/hooks/useAccounts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImportResultSummary, type ImportResult } from '@/components/shared/ImportResultSummary';
import { ColumnMapper, BROKER_MAPPABLE_FIELDS } from '@/components/shared/ColumnMapper';
import { ImportConfidenceNotice, needsReviewAcknowledgement } from '@/components/shared/ImportConfidenceNotice';
import { findBroker } from '@repo/shared/logic';

interface BrokerImportDialogProps {
  onClose: () => void;
}

type Step = 'options' | 'previewing' | 'mapping' | 'preview' | 'committing' | 'done';

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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !linkedAccountId) return;
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
      queryClient.invalidateQueries({ queryKey: ['investmentLog'] });
      queryClient.invalidateQueries({ queryKey: ['allInvestmentLog'] });
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      toast.success(`Imported ${committed.committed} trade${committed.committed === 1 ? '' : 's'}.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    }
  }

  const mappingComplete = ['date', 'symbol', 'tradeType', 'quantity', 'price'].every((f) => !!mapping[f]);
  const needsReview =
    !!result &&
    result.mappingSource !== undefined &&
    needsReviewAcknowledgement(result.mappingSource, result.institutionConfidence ?? null);
  const canConfirm = !!result && result.validCount > 0 && (!needsReview || reviewAcknowledged);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import from Broker</DialogTitle>
          <DialogDescription>
            Upload your broker&apos;s own tradebook export as-is — no template needed. Columns are detected
            automatically; if anything is unclear you&apos;ll be asked to map them, so nothing is ever guessed
            silently.
          </DialogDescription>
        </DialogHeader>

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

            <label
              className={`border-border/60 flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center transition-colors ${
                linkedAccountId ? 'hover:bg-muted/40 cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
            >
              <UploadCloud className="text-muted-foreground size-8" />
              <span className="text-sm font-medium">Click to choose your tradebook file</span>
              <span className="text-muted-foreground text-xs">
                {linkedAccountId ? 'CSV export from your broker' : 'Select a linked account first'}
              </span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                disabled={!linkedAccountId}
                onChange={handleFileChange}
              />
            </label>
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
