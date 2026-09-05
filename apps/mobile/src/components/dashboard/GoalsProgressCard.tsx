import { View } from "react-native";
import { calculateProgressPct } from "@repo/shared/logic";
import { AppText } from "@/components/common/AppText";
import { ProgressBar } from "@/components/common/ProgressBar";
import type { Goal } from "@repo/shared/types";

/** Mirrors apps/web/src/components/dashboard/GoalsProgressCard.tsx. */
export function GoalsProgressCard({ goals }: { goals: Goal[] }) {
  return (
    <View className="gap-4 rounded-2xl bg-card p-4">
      <AppText className="text-sm font-semibold">Goals in progress</AppText>
      {goals.length === 0 ? (
        <AppText className="text-sm text-muted-foreground">No goals yet.</AppText>
      ) : (
        <View className="gap-4">
          {goals.slice(0, 4).map((goal) => {
            const progressPct = calculateProgressPct(goal.saved_amount, goal.target_amount);
            return (
              <View key={goal.id} className="gap-1.5">
                <View className="flex-row justify-between gap-2">
                  <AppText className="flex-1 text-sm font-medium" numberOfLines={1}>
                    {goal.goal_name}
                  </AppText>
                  <AppText className="text-sm text-muted-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                    {(progressPct * 100).toFixed(0)}%
                  </AppText>
                </View>
                <ProgressBar value={Math.min(progressPct * 100, 100)} />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
