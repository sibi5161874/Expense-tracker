import { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Target, CheckCircle2 } from "lucide-react-native";
import { useGoals } from "@/hooks/useGoals";
import { calculateProgressPct, calculateGoalStatus } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { AppHeader } from "@/components/common/AppHeader";
import { Card } from "@/components/common/Card";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { ReportExportBar } from "@/components/shared/ReportExportBar";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 Goal Progress Report Screen
 */
export default function GoalProgressReportScreen() {
  const { theme } = useTheme();
  const { data: goals, isLoading, error } = useGoals();

  const sheets = useMemo(
    () => [
      {
        name: "Goal Progress",
        headers: ["Goal Name", "Target Amount (INR)", "Saved Amount (INR)", "Progress (%)", "Target Date", "Status"],
        rows: (goals ?? []).map((g) => {
          const progressPct = calculateProgressPct(g.saved_amount, g.target_amount);
          const status = calculateGoalStatus(g.saved_amount, g.target_amount, g.target_date);
          return {
            "Goal Name": g.goal_name,
            "Target Amount (INR)": g.target_amount,
            "Saved Amount (INR)": g.saved_amount,
            "Progress (%)": `${Math.round(progressPct * 100)}%`,
            "Target Date": g.target_date,
            Status: status,
          };
        }),
      },
    ],
    [goals]
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      <AppHeader showBack />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Goal Progress"
          description="Savings vs targets across all tracked financial goals"
        />

        <ReportExportBar
          title="Goal Progress Statement"
          description="Audit of all milestones, target dates, and saved balances"
          sheets={sheets}
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}
        {error && (
          <Card variant="outlined" className="p-4 border-destructive/40 bg-destructive/10">
            <AppText className="text-sm text-destructive">{error.message}</AppText>
          </Card>
        )}

        <View className="gap-3">
          {goals?.map((g) => {
            const progressPct = calculateProgressPct(g.saved_amount, g.target_amount);
            const status = calculateGoalStatus(g.saved_amount, g.target_amount, g.target_date);
            const isCompleted = progressPct >= 1;

            return (
              <Card key={g.id} variant="outlined" className="p-4 gap-2.5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Target size={18} color={isCompleted ? theme.success : theme.primary} />
                    <AppText className="text-sm font-semibold text-foreground">{g.goal_name}</AppText>
                  </View>
                  <StatusBadge tone={isCompleted ? "success" : "info"}>
                    {status.toUpperCase()}
                  </StatusBadge>
                </View>

                <View className="flex-row items-center justify-between text-xs">
                  <AppText className="text-xs text-muted-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                    Saved: {formatINR(g.saved_amount)} / {formatINR(g.target_amount)}
                  </AppText>
                  <AppText className="text-xs font-bold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                    {Math.round(progressPct * 100)}%
                  </AppText>
                </View>

                {/* Progress Bar */}
                <View className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(3, progressPct * 100))}%`,
                      backgroundColor: isCompleted ? theme.success : theme.primary,
                    }}
                  />
                </View>

                <AppText className="text-[11px] text-muted-foreground">
                  Target Date: {g.target_date}
                </AppText>
              </Card>
            );
          })}

          {!isLoading && (!goals || goals.length === 0) && (
            <Card variant="outlined" className="p-6 items-center justify-center">
              <AppText className="text-sm text-muted-foreground">No financial goals tracked yet.</AppText>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
