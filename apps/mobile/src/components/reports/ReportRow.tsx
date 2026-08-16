import { View } from "react-native";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";

interface ReportRowValue {
  label: string;
  value: number;
  sign?: "positive" | "negative" | "neutral";
}

/** Generic flat row for tabular reports — a title on the left, one or more labeled amounts
 * stacked on the right, an optional badge/status slot. Reused across most reports instead
 * of one bespoke row component per report. */
export function ReportRow({
  title,
  subtitle,
  values,
  badge,
}: {
  title: string;
  subtitle?: string;
  values: ReportRowValue[];
  badge?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3.5">
      <View className="flex-1">
        <AppText className="text-sm font-medium" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle && <AppText className="text-xs text-muted-foreground">{subtitle}</AppText>}
      </View>
      <View className="items-end gap-1">
        {badge}
        {values.map((v) => (
          <View key={v.label} className="flex-row items-center gap-1.5">
            <AppText className="text-xs text-muted-foreground">{v.label}</AppText>
            <AmountText value={v.value} sign={v.sign ?? "neutral"} className="text-sm font-medium" />
          </View>
        ))}
      </View>
    </View>
  );
}
