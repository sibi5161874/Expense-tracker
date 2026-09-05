import { ScrollView, View } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useThemeColor } from "@/lib/colors";

export interface ImportReconciliation {
  checkable: boolean;
  totalChecked: number;
  mismatches: number;
  firstMismatchRow: number | null;
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
  mappingSource?: "exact" | "heuristic" | "manual";
  institutionConfidence?: "verified" | "partial" | "heuristic" | null;
}

interface ImportResultSummaryProps {
  result: ImportResult;
  step: "preview" | "committing" | "done";
}

/** Self-check banner comparing parsed amounts against the file's own running balance. */
function ReconciliationBanner({ reconciliation }: { reconciliation: ImportReconciliation }) {
  const success = useThemeColor("success");
  const warningForeground = useThemeColor("warningForeground");

  if (!reconciliation.checkable) return null;

  if (reconciliation.totalChecked === 0) {
    return (
      <AppText className="text-xs text-muted-foreground">
        A balance column was found, but there weren&apos;t enough consecutive rows to self-check against it.
      </AppText>
    );
  }

  if (reconciliation.mismatches === 0) {
    return (
      <AppText className="text-xs" style={{ color: success }}>
        ✓ Self-check passed — every row&apos;s amount matches the file&apos;s own running balance (
        {reconciliation.totalChecked} row{reconciliation.totalChecked === 1 ? "" : "s"} checked).
      </AppText>
    );
  }

  return (
    <View className="gap-1 rounded-2xl bg-warning-subtle p-3">
      <AppText className="text-sm font-medium" style={{ color: warningForeground }}>
        ⚠ Self-check found {reconciliation.mismatches} of {reconciliation.totalChecked} row
        {reconciliation.totalChecked === 1 ? "" : "s"} don&apos;t match this file&apos;s own running balance
        {reconciliation.firstMismatchRow ? ` (first at row ${reconciliation.firstMismatchRow})` : ""}.
      </AppText>
      <AppText className="text-xs text-muted-foreground">
        This usually means a column was mapped to the wrong field. Review the preview below carefully, or go
        back and adjust the mapping, before confirming.
      </AppText>
    </View>
  );
}

/** Mirrors apps/web/src/components/shared/ImportResultSummary.tsx — no RN equivalent of an
 * HTML table, so the preview renders as a scrollable stack of compact per-row cards instead
 * of a grid. */
export function ImportResultSummary({ result, step }: ImportResultSummaryProps) {
  return (
    <View className="gap-4">
      <View className="flex-row gap-3">
        <View className="flex-1 items-center rounded-2xl bg-muted p-3">
          <AppText className="text-lg font-semibold">{result.totalDataRows}</AppText>
          <AppText className="text-xs text-muted-foreground">Rows in file</AppText>
        </View>
        <View className="flex-1 items-center rounded-2xl bg-muted p-3">
          <AppText className="text-lg font-semibold">{step === "done" ? result.committed : result.validCount}</AppText>
          <AppText className="text-xs text-muted-foreground">{step === "done" ? "Imported" : "Ready"}</AppText>
        </View>
        <View className="flex-1 items-center rounded-2xl bg-muted p-3">
          <AppText className="text-lg font-semibold">{result.duplicateCount}</AppText>
          <AppText className="text-xs text-muted-foreground">Duplicates</AppText>
        </View>
      </View>

      {result.reconciliation && <ReconciliationBanner reconciliation={result.reconciliation} />}

      {result.errors.length > 0 && (
        <ScrollView className="max-h-40 rounded-2xl bg-destructive-subtle p-3">
          <AppText className="mb-1 text-sm font-medium text-destructive">{result.errors.length} row error(s):</AppText>
          {result.errors.map((e, i) => (
            <AppText key={i} className="text-xs text-destructive">
              Row {e.row}: {e.reason}
            </AppText>
          ))}
        </ScrollView>
      )}

      {result.preview.length > 0 && (
        <View className="gap-2">
          <AppText className="text-xs font-medium text-muted-foreground">Preview (first {result.preview.length} rows)</AppText>
          <ScrollView className="max-h-64 rounded-2xl bg-card" contentContainerClassName="gap-2 p-3">
            {result.preview.map((row, i) => (
              <View
                key={i}
                className={
                  i < result.preview.length - 1 ? "gap-0.5 border-b border-border pb-2" : "gap-0.5"
                }
              >
                {Object.entries(row).map(([key, val]) => (
                  <View key={key} className="flex-row justify-between gap-3">
                    <AppText className="text-xs text-muted-foreground">{key}</AppText>
                    <AppText className="text-xs font-medium">{val === null || val === undefined ? "—" : String(val)}</AppText>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {step === "done" && <AppText className="text-sm text-muted-foreground">Done. You can close this now.</AppText>}
    </View>
  );
}
