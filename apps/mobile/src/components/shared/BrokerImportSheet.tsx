import { useState } from "react";
import { Modal, Pressable, ScrollView, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { X, Upload } from "lucide-react-native";
import { parseCsv } from "@repo/shared";
import {
  resolveBrokerMapping,
  buildBrokerImportPlan,
  rowsToRecords,
  findBroker,
  BROKERS,
  type BrokerColumnMapping,
} from "@repo/shared/logic";
import { getInvestmentLogForDedup, createInvestmentLogsBulk } from "@repo/shared/queries/investmentLog";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useAccounts } from "@/hooks/useAccounts";
import { AppText } from "@/components/common/AppText";
import { Button } from "@/components/common/Button";
import { PickerField } from "@/components/common/PickerField";
import { ColumnMapper, BROKER_MAPPABLE_FIELDS } from "@/components/shared/ColumnMapper";
import { ImportConfidenceNotice, needsReviewAcknowledgement } from "@/components/shared/ImportConfidenceNotice";
import { ImportResultSummary, type ImportResult } from "@/components/shared/ImportResultSummary";
import { useThemeColor } from "@/lib/colors";

interface BrokerImportSheetProps {
  visible: boolean;
  onClose: () => void;
  onImported: () => void;
}

type Step = "options" | "previewing" | "mapping" | "preview" | "committing" | "done";

const REQUIRED = ["date", "symbol", "tradeType", "quantity", "price"] as const;

function validateManualMapping(mapping: Record<string, string> | undefined, headers: string[]): BrokerColumnMapping | null {
  if (!mapping) return null;
  const has = (v: string | undefined) => !!v && headers.includes(v);
  if (!REQUIRED.every((f) => has(mapping[f]))) return null;
  return {
    date: mapping.date!,
    symbol: mapping.symbol!,
    tradeType: mapping.tradeType!,
    quantity: mapping.quantity!,
    price: mapping.price!,
    exchange: has(mapping.exchange) ? mapping.exchange : undefined,
  };
}

/**
 * Mobile equivalent of BrokerImportDialog.tsx — same options → mapping → preview → commit
 * flow, but runs the shared pure functions client-side instead of POSTing to apps/web's
 * /api/import/broker route, since there's no Next.js server here to call.
 */
export function BrokerImportSheet({ visible, onClose, onImported }: BrokerImportSheetProps) {
  const { user } = useAuth();
  const supabase = useSupabaseClient();
  const { data: accounts } = useAccounts(true);
  const mutedForeground = useThemeColor("mutedForeground");
  const accentForeground = useThemeColor("accentForeground");

  const [step, setStep] = useState<Step>("options");
  const [broker, setBroker] = useState("ZERODHA");
  const [linkedAccountId, setLinkedAccountId] = useState("");
  const [csvText, setCsvText] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);

  function reset() {
    setStep("options");
    setCsvText(null);
    setResult(null);
    setErrorMessage(null);
    setHeaders([]);
    setMapping({});
    setReviewAcknowledged(false);
  }

  async function runImport(csv: string, commit: boolean, overrideMapping?: Record<string, string>): Promise<ImportResult | null> {
    if (!user) throw new Error("Not authenticated");
    const rows = parseCsv(csv);
    if (rows.length === 0) throw new Error("File is empty.");
    const fileHeaders = rows[0]!.map((h) => h.trim());

    const manual = validateManualMapping(overrideMapping, fileHeaders);
    const auto = manual ? null : resolveBrokerMapping(fileHeaders, broker);
    const resolvedMapping = manual ?? auto?.mapping ?? null;

    if (!resolvedMapping) {
      setHeaders(fileHeaders);
      setErrorMessage("Couldn't work out which columns to use — please map them below.");
      setStep("mapping");
      return null;
    }

    if (!(accounts ?? []).some((a) => a.id === linkedAccountId)) {
      throw new Error("Selected account not found.");
    }

    const matchedBroker = findBroker(broker);
    const brokerLabel = matchedBroker?.label ?? broker ?? "broker";

    const existing = await getInvestmentLogForDedup(supabase, user.id);
    const existingKeys = (existing ?? []).map((i) => `${i.date}|${i.symbol}|${Number(i.quantity)}|${Number(i.price)}`);
    const records = rowsToRecords(rows, fileHeaders);
    const { errors, validRows, duplicateCount } = buildBrokerImportPlan(
      resolvedMapping,
      records,
      linkedAccountId,
      existingKeys,
      brokerLabel
    );

    let committed = 0;
    if (commit && validRows.length > 0) {
      const inserted = await createInvestmentLogsBulk(supabase, user.id, validRows);
      committed = inserted.length;
    }

    return {
      totalDataRows: records.length,
      validCount: validRows.length,
      duplicateCount,
      errors,
      preview: validRows.slice(0, 10),
      committed,
      mappingSource: manual ? "manual" : (auto?.source ?? "heuristic"),
      institutionConfidence: matchedBroker?.confidence ?? null,
    };
  }

  async function handlePickFile() {
    if (!linkedAccountId) return;
    const picked = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/comma-separated-values", "*/*"] });
    if (picked.canceled || !picked.assets[0]) return;

    setErrorMessage(null);
    setStep("previewing");
    try {
      const text = await FileSystem.readAsStringAsync(picked.assets[0].uri, { encoding: "utf8" as FileSystem.EncodingType });
      setCsvText(text);
      const preview = await runImport(text, false);
      if (preview) {
        setResult(preview);
        setReviewAcknowledged(false);
        setStep("preview");
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to parse file");
      setStep("options");
    }
  }

  async function handleApplyMapping() {
    if (!csvText) return;
    setErrorMessage(null);
    setStep("previewing");
    try {
      const preview = await runImport(csvText, false, mapping);
      if (preview) {
        setResult(preview);
        setStep("preview");
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to parse file");
      setStep("mapping");
    }
  }

  async function handleConfirm() {
    if (!csvText) return;
    setStep("committing");
    try {
      const committed = await runImport(csvText, true, Object.keys(mapping).length ? mapping : undefined);
      if (!committed) return;
      setResult(committed);
      setStep("done");
      Alert.alert("Import complete", `Imported ${committed.committed} trade${committed.committed === 1 ? "" : "s"}.`);
      onImported();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Import failed");
      setStep("preview");
    }
  }

  const mappingComplete = REQUIRED.every((f) => !!mapping[f]);
  const needsReview =
    !!result && result.mappingSource !== undefined && needsReviewAcknowledgement(result.mappingSource, result.institutionConfidence ?? null);
  const canConfirm = !!result && result.validCount > 0 && (!needsReview || reviewAcknowledged);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        reset();
        onClose();
      }}
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between bg-card px-4 py-3">
          <AppText className="text-base font-semibold">Import from Broker</AppText>
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
          <AppText className="text-sm text-muted-foreground">
            Upload your broker&apos;s own tradebook export as-is — no template needed. Columns are detected
            automatically; if anything is unclear you&apos;ll be asked to map them.
          </AppText>

          {errorMessage && <AppText className="rounded-2xl bg-destructive-subtle p-3 text-sm text-destructive">{errorMessage}</AppText>}

          {step === "options" && (
            <View className="gap-4">
              <PickerField
                label="Broker"
                value={broker}
                options={BROKERS.map((b) => ({
                  label: b.label,
                  value: b.id,
                  domain: b.domain,
                }))}
                onChange={setBroker}
              />
              <PickerField
                label="Linked account"
                value={linkedAccountId}
                options={(accounts ?? []).map((a) => ({ label: `${a.name} (${a.type})`, value: a.id }))}
                onChange={setLinkedAccountId}
                placeholder="Select account"
              />
              <Pressable
                onPress={handlePickFile}
                disabled={!linkedAccountId}
                className="flex-row items-center justify-center gap-2 rounded-2xl border border-border py-4"
                style={{ opacity: linkedAccountId ? 1 : 0.5 }}
              >
                <Upload size={16} color={accentForeground} />
                <AppText className="text-sm font-medium">
                  {linkedAccountId ? "Choose tradebook file" : "Select a linked account first"}
                </AppText>
              </Pressable>
            </View>
          )}

          {step === "previewing" && <AppText className="py-8 text-center text-sm text-muted-foreground">Reading file…</AppText>}

          {step === "mapping" && <ColumnMapper headers={headers} fields={BROKER_MAPPABLE_FIELDS} value={mapping} onChange={setMapping} />}

          {step === "preview" && result && result.mappingSource && (
            <ImportConfidenceNotice
              institutionLabel={findBroker(broker)?.label ?? broker}
              mappingSource={result.mappingSource}
              institutionConfidence={result.institutionConfidence ?? null}
              acknowledged={reviewAcknowledged}
              onAcknowledgedChange={setReviewAcknowledged}
            />
          )}

          {(step === "preview" || step === "committing" || step === "done") && result && (
            <ImportResultSummary result={result} step={step} />
          )}
        </ScrollView>

        <View className="flex-row gap-3 bg-card p-4">
          {(step === "options" || step === "mapping" || step === "preview") && (
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
          )}
          {step === "mapping" && (
            <Button className="flex-1" onPress={handleApplyMapping} disabled={!mappingComplete}>
              Preview with these columns
            </Button>
          )}
          {step === "preview" && (
            <Button className="flex-1" onPress={handleConfirm} disabled={!canConfirm}>
              Confirm Import ({result?.validCount ?? 0})
            </Button>
          )}
          {step === "committing" && (
            <Button className="flex-1" disabled>
              Importing…
            </Button>
          )}
          {step === "done" && (
            <Button
              className="flex-1"
              onPress={() => {
                reset();
                onClose();
              }}
            >
              Close
            </Button>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
