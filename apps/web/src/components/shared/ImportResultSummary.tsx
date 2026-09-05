import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface ImportReconciliation {
  checkable: boolean;
  totalChecked: number;
  mismatches: number;
  firstMismatchRow: number | null;
  /** Not rendered — carried through so a chunked bank-statement commit can seed the next
   * chunk's reconciliation check with it. See checkBalanceReconciliation's doc comment. */
  lastBalance?: number | null;
}

export interface ImportResult {
  totalDataRows: number;
  validCount: number;
  duplicateCount: number;
  errors: { row: number; reason: string }[];
  preview: Record<string, unknown>[];
  committed: number;
  /** Only present for bank statement imports with a mapped balance column. */
  reconciliation?: ImportReconciliation;
  /** Only present for bank/broker native imports — see ImportConfidenceNotice. */
  mappingSource?: 'exact' | 'heuristic' | 'manual';
  institutionConfidence?: 'verified' | 'partial' | 'heuristic' | null;
}

interface ImportResultSummaryProps {
  result: ImportResult;
  step: 'preview' | 'committing' | 'partial' | 'done';
}

/**
 * Self-check banner: compares the parsed amounts against the file's own
 * running balance column, when one was mapped. This is what actually verifies
 * a heuristic-detected mapping for an unverified institution — no reference
 * format needed, because the check is against the file's own arithmetic.
 */
function ReconciliationBanner({ reconciliation }: { reconciliation: ImportReconciliation }) {
  if (!reconciliation.checkable) return null;

  if (reconciliation.totalChecked === 0) {
    return (
      <p className="text-muted-foreground text-xs">
        A balance column was found, but there weren&apos;t enough consecutive rows to self-check against it.
      </p>
    );
  }

  if (reconciliation.mismatches === 0) {
    return (
      <p className="text-success text-xs">
        ✓ Self-check passed — every row&apos;s amount matches the file&apos;s own running balance (
        {reconciliation.totalChecked} row{reconciliation.totalChecked === 1 ? '' : 's'} checked).
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
      <p className="font-medium text-warning-foreground">
        ⚠ Self-check found {reconciliation.mismatches} of {reconciliation.totalChecked} row
        {reconciliation.totalChecked === 1 ? '' : 's'} don&apos;t match this file&apos;s own running balance
        {reconciliation.firstMismatchRow ? ` (first at row ${reconciliation.firstMismatchRow})` : ''}.
      </p>
      <p className="text-muted-foreground mt-1 text-xs">
        This usually means a column was mapped to the wrong field. Review the preview below carefully, or go
        back and adjust the mapping, before confirming.
      </p>
    </div>
  );
}

/** Shared preview/result rendering for every CSV/statement import dialog (standard + bank). */
export function ImportResultSummary({ result, step }: ImportResultSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-lg font-semibold">{result.totalDataRows}</div>
          <div className="text-muted-foreground text-xs">Rows in file</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-lg font-semibold">
            {step === 'preview' ? result.validCount : result.committed}
          </div>
          <div className="text-muted-foreground text-xs">
            {step === 'preview' ? 'Ready to import' : step === 'partial' ? 'Imported so far' : 'Imported'}
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-lg font-semibold">{result.duplicateCount}</div>
          <div className="text-muted-foreground text-xs">Duplicates skipped</div>
        </div>
      </div>

      {result.reconciliation && <ReconciliationBanner reconciliation={result.reconciliation} />}

      {result.errors.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <p className="mb-1 font-medium text-destructive">{result.errors.length} row error(s):</p>
          <ul className="space-y-0.5 text-destructive/90">
            {result.errors.map((e, i) => (
              <li key={i}>
                Row {e.row}: {e.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.preview.length > 0 && (
        <div className="border-border/60 max-h-64 overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {Object.keys(result.preview[0]!).map((key) => (
                  <TableHead key={key} className="text-xs whitespace-nowrap">
                    {key}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.preview.map((row, i) => (
                <TableRow key={i}>
                  {Object.values(row).map((val, j) => (
                    <TableCell key={j} className="text-xs whitespace-nowrap">
                      {val === null || val === undefined ? '' : String(val)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {step === 'done' && <p className="text-muted-foreground text-sm">Done. You can close this dialog now.</p>}
    </div>
  );
}
