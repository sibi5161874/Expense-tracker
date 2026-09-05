import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGoals } from "@/hooks/useGoals";
import { calculateProgressPct, calculateGoalStatus } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { ProgressBar } from "@/components/common/ProgressBar";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { goalStatusTone } from "@/lib/badgeTones";
import { useThemeColor } from "@/lib/colors";

/** Read-only — no edit/delete here, matching the web report (that's what the Goals tab
 * is for). Same underlying data, presented as a summary rather than a management list. */
export default function GoalProgressReportScreen() {
  const { data: goals, isLoading, error } = useGoals();
  const primary = useThemeColor("primary");

  const sheets = [
    {
      name: "Goal Progress",
      rows: (goals ?? []).map((g) => ({
        Goal: g.goal_name,
        Saved: g.saved_amount,
        Target: g.target_amount,
        Status: calculateGoalStatus(g.saved_amount, g.target_amount, g.target_date),
      })),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-3 p-4 pb-32">
        <PageHeader title="Goal Progress" description="Saved vs target for every goal." />
        {!isLoading && goals && goals.length > 0 && (
          <ReportExportBar title="Goal Progress" description="Saved vs target for every goal." sheets={sheets} />
        )}
        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : !goals || goals.length === 0 ? (
          <AppText className="py-8 text-center text-sm text-muted-foreground">
            No goals found. Add your first goal to get started.
          </AppText>
        ) : (
          goals.map((g) => {
            const progressPct = calculateProgressPct(g.saved_amount, g.target_amount);
            const status = calculateGoalStatus(g.saved_amount, g.target_amount, g.target_date);
            return (
              <View key={g.id} className="gap-3 rounded-2xl bg-card p-5">
                <View className="flex-row items-center justify-between">
                  <AppText className="font-semibold">{g.goal_name}</AppText>
                  <StatusBadge tone={goalStatusTone(status)}>{status}</StatusBadge>
                </View>
                <ProgressBar value={Math.min(progressPct * 100, 100)} />
                <View className="flex-row justify-between">
                  <AppText className="text-sm text-muted-foreground">{formatINR(g.saved_amount)} saved</AppText>
                  <AppText className="text-sm text-muted-foreground">{formatINR(g.target_amount)} target</AppText>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
