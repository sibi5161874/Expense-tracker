import { View } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useThemeColor } from "@/lib/colors";

interface CashFlowBarsProps {
  data: Array<{ label: string; income: number; expense: number }>;
}

/**
 * Mobile equivalent of CashFlowChart.tsx. Recharts doesn't run on React Native, so this is a
 * hand-built grouped bar chart from plain Views — same semantic colors (success/destructive
 * for income/expense, matching every other sign-coded amount in the app), same legend below.
 */
export function CashFlowBars({ data }: CashFlowBarsProps) {
  const success = useThemeColor("success");
  const destructive = useThemeColor("destructive");

  const hasData = data.some((d) => d.income > 0 || d.expense > 0);
  if (!hasData) {
    return (
      <View className="h-40 items-center justify-center">
        <AppText className="text-sm text-muted-foreground">No cash flow yet — it fills in as you log transactions.</AppText>
      </View>
    );
  }

  const max = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);

  return (
    <View className="gap-2">
      <View className="h-40 flex-row items-end gap-3">
        {data.map((d) => (
          <View key={d.label} className="flex-1 flex-row items-end justify-center gap-1">
            <View
              style={{ height: `${(d.income / max) * 100}%`, backgroundColor: success }}
              className="w-2.5 rounded-t"
            />
            <View
              style={{ height: `${(d.expense / max) * 100}%`, backgroundColor: destructive }}
              className="w-2.5 rounded-t"
            />
          </View>
        ))}
      </View>
      <View className="flex-row gap-3">
        {data.map((d) => (
          <AppText key={d.label} className="flex-1 text-center text-xs text-muted-foreground">
            {d.label}
          </AppText>
        ))}
      </View>
      <View className="flex-row gap-4 pt-1">
        <View className="flex-row items-center gap-1.5">
          <View className="size-2 rounded-full" style={{ backgroundColor: success }} />
          <AppText className="text-xs text-muted-foreground">Income</AppText>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="size-2 rounded-full" style={{ backgroundColor: destructive }} />
          <AppText className="text-xs text-muted-foreground">Expense</AppText>
        </View>
      </View>
    </View>
  );
}
