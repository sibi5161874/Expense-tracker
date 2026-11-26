import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { CheckCircle2, XCircle } from "lucide-react-native";
import { useFinancialEssentials } from "@/hooks/useFinancialEssentials";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import type { BadgeTone } from "@/lib/badgeTones";
import { useThemeColor } from "@/lib/colors";
import { useTheme } from "@/theme/ThemeProvider";

function scoreTone(score: number): BadgeTone {
  if (score >= 8) return "success";
  if (score >= 5) return "warning";
  return "destructive";
}

/** Awwwards-Craft Financial Essentials Check with tactile feedback and tabular numerals. */
export function FinancialEssentialsCard() {
  const { theme } = useTheme();
  const { items, isLoading, hasProfileData, score } = useFinancialEssentials();
  const success = useThemeColor("success");
  const destructive = useThemeColor("destructive");

  if (isLoading) return null;

  return (
    <View className="gap-4 rounded-2xl border border-border/70 bg-card p-4.5 shadow-sm">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <AppText className="text-sm font-semibold tracking-tight text-foreground">
            Financial Essentials Check
          </AppText>
          {score !== null && (
            <StatusBadge tone={scoreTone(score)}>
              {`${score}/10`}
            </StatusBadge>
          )}
        </View>
        {!hasProfileData && (
          <Pressable
            onPress={() => router.push("/settings")}
            className="active:opacity-75"
          >
            <AppText className="text-xs font-semibold text-primary">
              Add details
            </AppText>
          </Pressable>
        )}
      </View>

      <View className="gap-3">
        {items.map((item) => (
          <View key={item.key} className="flex-row items-center justify-between gap-3">
            <View className="flex-1 flex-row items-center gap-2.5">
              {item.adequate ? (
                <CheckCircle2 size={16} color={success} />
              ) : (
                <XCircle size={16} color={destructive} />
              )}
              <AppText className="flex-1 text-sm font-medium text-foreground" numberOfLines={1}>
                {item.label}
              </AppText>
            </View>
            <AppText
              className="text-xs font-medium"
              style={{
                fontVariant: ["tabular-nums"],
                color: item.adequate ? success : destructive,
              }}
            >
              {formatINR(item.current)} / {formatINR(item.recommended)}
            </AppText>
          </View>
        ))}
      </View>

      <AppText className="text-[11px] text-muted-foreground">
        Estimates based on your financial data.
      </AppText>
    </View>
  );
}
