import { View } from "react-native";
import { router } from "expo-router";
import { PiggyBank } from "lucide-react-native";
import { useEntitlements } from "@/hooks/useEntitlements";
import { usePassiveIncome } from "@/hooks/usePassiveIncome";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { ProBlurredPreview } from "@/components/shared/ProGate";
import { useThemeColor } from "@/lib/colors";
import type { SymbolHolding } from "@repo/shared/logic";

function LivePassiveIncome({ holdings }: { holdings: SymbolHolding[] }) {
  const { annualIncome, monthlyIncome, isLoading } = usePassiveIncome(holdings);
  const success = useThemeColor("success");

  return (
    <View className="gap-1 rounded-2xl bg-card p-4">
      <View className="flex-row items-center gap-2">
        <PiggyBank size={16} color={success} />
        <AppText className="text-sm font-semibold">Passive Income</AppText>
      </View>
      {isLoading ? (
        <AppText className="py-2 text-sm text-muted-foreground">Calculating from your holdings&apos; dividend yield…</AppText>
      ) : (
        <>
          <AppText className="text-2xl font-semibold" style={{ fontVariant: ["tabular-nums"] }}>
            {formatINR(annualIncome)} <AppText className="text-sm font-normal text-muted-foreground">/ year</AppText>
          </AppText>
          <AppText className="mt-1 text-sm text-muted-foreground">
            You earn {formatINR(annualIncome)} per year in passive income — about {formatINR(monthlyIncome)} per month.
          </AppText>
        </>
      )}
    </View>
  );
}

/** Static, no network — shown blurred to free-tier users instead of mounting the real fetch. */
function PassiveIncomePlaceholder() {
  const success = useThemeColor("success");
  return (
    <View className="gap-1 rounded-2xl bg-card p-4">
      <View className="flex-row items-center gap-2">
        <PiggyBank size={16} color={success} />
        <AppText className="text-sm font-semibold">Passive Income</AppText>
      </View>
      <AppText className="text-2xl font-semibold" style={{ fontVariant: ["tabular-nums"] }}>
        {formatINR(42_000)} <AppText className="text-sm font-normal text-muted-foreground">/ year</AppText>
      </AppText>
      <AppText className="mt-1 text-sm text-muted-foreground">
        You earn {formatINR(42_000)} per year in passive income — about {formatINR(3_500)} per month.
      </AppText>
    </View>
  );
}

/** Mirrors apps/web/src/components/dashboard/PassiveIncomeWidget.tsx — projects
 * annual/monthly dividend income across every holding from its live trailing dividend
 * yield. Gated behind `livePriceRefresh`, same as web, since it needs the same live-data
 * fetch that feature already gates. */
export function PassiveIncomeWidget({ holdings }: { holdings: SymbolHolding[] }) {
  const { hasFeature } = useEntitlements();

  return (
    <ProBlurredPreview
      feature="livePriceRefresh"
      title="Passive Income Tracker"
      description="See your projected annual dividend income across all holdings."
      onUpgradePress={() => router.push("/(app)/billing")}
    >
      {hasFeature("livePriceRefresh") ? <LivePassiveIncome holdings={holdings} /> : <PassiveIncomePlaceholder />}
    </ProBlurredPreview>
  );
}
