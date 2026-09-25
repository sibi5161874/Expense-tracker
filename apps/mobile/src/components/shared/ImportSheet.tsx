import { useState } from "react";
import { Modal, Pressable, ScrollView, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { X, Upload } from "lucide-react-native";
import { parseCsv, headersMatch, rowsToRecords, type ImportRowError, type ImportRecord } from "@repo/shared";
import { AppText } from "@/components/common/AppText";
import { Button } from "@/components/common/Button";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { useThemeColor } from "@/lib/colors";

interface ImportPlanResult<T> {
  errors: ImportRowError[];
  validRows: T[];
  duplicateCount: number;
}

interface ImportSheetProps<T> {
  visible: boolean;
  onClose: () => void;
  entityLabel: string;
  templateColumns: readonly string[];
  buildPlan: (records: ImportRecord[]) => ImportPlanResult<T>;
  createBulk: (rows: T[]) => Promise<unknown>;
  onImported: () => void;
  assetType?: string;
}

/**
 * Mobile equivalent of ImportDialog.tsx — same dry-run-then-confirm flow, but calls the
 * shared `build*ImportPlan` pure functions (packages/shared/src/logic/csvImport.ts)
 * directly instead of POSTing to the web app's /api/import/* routes, since there's no
 * Next.js server for the mobile app to call. Same validation, same dedup logic, same
 * Zod schemas — just invoked client-side here instead of in a Route Handler.
 */
export function ImportSheet<T>({
  visible,
  onClose,
  entityLabel,
  templateColumns,
  buildPlan,
  createBulk,
  onImported,
  assetType: initialAssetType,
}: ImportSheetProps<T>) {
  const [selectedAssetType, setSelectedAssetType] = useState<string>(initialAssetType || "Stock");
  const [fileName, setFileName] = useState<string | null>(null);
  const [plan, setPlan] = useState<ImportPlanResult<T> | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const mutedForeground = useThemeColor("mutedForeground");
  const accentForeground = useThemeColor("accentForeground");

  const isInvestmentImport = entityLabel.toLowerCase().includes("investment");

  function reset() {
    setFileName(null);
    setPlan(null);
    setTotalRows(0);
  }

  async function handlePickFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/comma-separated-values", "*/*"] });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setFileName(asset.name);
    setIsProcessing(true);
    try {
      const text = await FileSystem.readAsStringAsync(asset.uri, { encoding: "utf8" as FileSystem.EncodingType });
      const rows = parseCsv(text);
      if (rows.length === 0) throw new Error("File is empty.");
      if (!headersMatch(rows[0]!, templateColumns)) {
        throw new Error(`Column headers don't match the template exactly. Expected: ${templateColumns.join(", ")}`);
      }
      const records = rowsToRecords(rows, templateColumns);
      setTotalRows(records.length);
      setPlan(buildPlan(records));
    } catch (e) {
      Alert.alert("Couldn't read file", e instanceof Error ? e.message : "Unknown error.");
      reset();
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleConfirm() {
    if (!plan || plan.validRows.length === 0) return;
    setIsCommitting(true);
    try {
      await createBulk(plan.validRows);
      Alert.alert("Import complete", `Imported ${plan.validRows.length} ${entityLabel} row${plan.validRows.length === 1 ? "" : "s"}.`);
      onImported();
      reset();
      onClose();
    } catch (e) {
      Alert.alert("Import failed", e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsCommitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between bg-card px-4 py-3">
          <AppText className="text-base font-semibold">Import {entityLabel}</AppText>
          <Pressable
            onPress={() => {
              reset();
              onClose();
            }}
            hitSlop={14}
          >
            <X size={20} color={mutedForeground} />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="gap-4 p-4">
          {isInvestmentImport && (
            <View className="gap-1.5">
              <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Asset Class
              </AppText>
              <SegmentedControl
                options={[
                  { value: "Stock", label: "Stock" },
                  { value: "Mutual Fund", label: "Mutual Fund" },
                  { value: "ETF", label: "ETF" },
                  { value: "Gold", label: "Gold" },
                ]}
                value={selectedAssetType}
                onChange={setSelectedAssetType}
              />
            </View>
          )}

          <AppText className="text-sm text-muted-foreground">
            Pick a CSV with columns: {templateColumns.join(", ")}
          </AppText>

          <Pressable
            onPress={handlePickFile}
            disabled={isProcessing}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-border py-4"
          >
            <Upload size={16} color={accentForeground} />
            <AppText className="text-sm font-medium">
              {isProcessing ? "Reading..." : fileName ? `Change file (${fileName})` : "Choose CSV File"}
            </AppText>
          </Pressable>

          {plan && (
            <View className="gap-3 rounded-2xl bg-card p-4">
              <View className="flex-row justify-between">
                <AppText className="text-sm text-muted-foreground">Total rows</AppText>
                <AppText className="text-sm font-medium">{totalRows}</AppText>
              </View>
              <View className="flex-row justify-between">
                <AppText className="text-sm text-muted-foreground">Ready to import</AppText>
                <AppText className="text-sm font-medium text-success">{plan.validRows.length}</AppText>
              </View>
              <View className="flex-row justify-between">
                <AppText className="text-sm text-muted-foreground">Duplicates skipped</AppText>
                <AppText className="text-sm font-medium">{plan.duplicateCount}</AppText>
              </View>
              {plan.errors.length > 0 && (
                <View className="gap-1">
                  <AppText className="text-sm font-medium text-destructive">{plan.errors.length} row error(s)</AppText>
                  {plan.errors.slice(0, 10).map((e, i) => (
                    <AppText key={i} className="text-xs text-muted-foreground">
                      Row {e.row}: {e.reason}
                    </AppText>
                  ))}
                  {plan.errors.length > 10 && (
                    <AppText className="text-xs text-muted-foreground">…and {plan.errors.length - 10} more</AppText>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View className="flex-row gap-3 bg-card p-4">
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button className="flex-1" onPress={handleConfirm} disabled={!plan || plan.validRows.length === 0 || isCommitting}>
            {isCommitting ? "Importing..." : `Import ${plan?.validRows.length ?? 0}`}
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
