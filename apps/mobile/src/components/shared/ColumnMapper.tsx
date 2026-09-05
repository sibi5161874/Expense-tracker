import { View } from "react-native";
import { AppText } from "@/components/common/AppText";
import { PickerField } from "@/components/common/PickerField";

export interface MappableField {
  key: string;
  label: string;
  required?: boolean;
  hint?: string;
}

interface ColumnMapperProps {
  headers: string[];
  fields: MappableField[];
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}

const NONE = "__none__";

/**
 * Mirrors apps/web/src/components/shared/ColumnMapper.tsx — the manual mapping backstop
 * shown whenever automatic column detection can't resolve every required field, so the
 * user confirms the interpretation instead of the importer guessing.
 */
export function ColumnMapper({ headers, fields, value, onChange }: ColumnMapperProps) {
  function setField(key: string, selected: string) {
    const next = { ...value };
    if (selected === NONE) {
      delete next[key];
    } else {
      next[key] = selected;
    }
    onChange(next);
  }

  return (
    <View className="gap-4">
      <AppText className="text-sm text-muted-foreground">
        Tell us which column in your file holds each value. You&apos;ll see a preview before anything is
        imported.
      </AppText>
      {fields.map((field) => (
        <View key={field.key}>
          <PickerField
            label={field.required ? `${field.label} *` : field.label}
            value={value[field.key] ?? NONE}
            options={[
              ...(field.required ? [] : [{ label: "— Not in my file —", value: NONE }]),
              ...headers.map((h) => ({ label: h, value: h })),
            ]}
            onChange={(v) => setField(field.key, v)}
          />
          {field.hint && <AppText className="mt-1 text-xs text-muted-foreground">{field.hint}</AppText>}
        </View>
      ))}
    </View>
  );
}

export const BANK_MAPPABLE_FIELDS: MappableField[] = [
  { key: "date", label: "Transaction date", required: true },
  { key: "description", label: "Description / narration", required: true },
  { key: "debit", label: "Debit / withdrawal", hint: "Leave empty if your file uses one amount column" },
  { key: "credit", label: "Credit / deposit", hint: "Leave empty if your file uses one amount column" },
  { key: "amount", label: "Amount (single column)", hint: "Only if debit and credit share one column" },
  { key: "drCrIndicator", label: "DR/CR indicator", hint: "The column marking money in vs out" },
  { key: "balance", label: "Running balance", hint: "Optional — lets us self-check the import against your file" },
];

export const BROKER_MAPPABLE_FIELDS: MappableField[] = [
  { key: "date", label: "Trade date", required: true },
  { key: "symbol", label: "Symbol / scheme name", required: true },
  { key: "tradeType", label: "Buy or sell", required: true },
  { key: "quantity", label: "Quantity / units", required: true },
  { key: "price", label: "Price / NAV", required: true },
  { key: "exchange", label: "Exchange", hint: "Optional — defaults to NSE" },
];
