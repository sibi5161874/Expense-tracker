import { memo } from "react";
import { Pressable, View } from "react-native";
import { Pencil, Target, Trash2 } from "lucide-react-native";
import type { Goal } from "@repo/shared/types";
import { calculateProgressPct, calculateGoalStatus } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { ProgressBar } from "@/components/common/ProgressBar";
import { useThemeColor } from "@/lib/colors";
import { goalStatusTone } from "@/lib/badgeTones";

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

/** Mobile equivalent of GoalCard.tsx — flat rounded-2xl card, no border/shadow. */
function GoalCardComponent({ goal, onEdit, onDelete }: GoalCardProps) {
  const accentForeground = useThemeColor("accentForeground");
  const progressPct = calculateProgressPct(goal.saved_amount, goal.target_amount);
  const status = calculateGoalStatus(goal.saved_amount, goal.target_amount, goal.target_date);

  return (
    <View className="gap-4 rounded-2xl bg-card p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="size-9 items-center justify-center rounded-full bg-accent">
            <Target size={18} color={accentForeground} />
          </View>
          <View className="flex-1">
            <AppText className="font-semibold" numberOfLines={1}>
              {goal.goal_name}
            </AppText>
            <AppText className="text-sm text-muted-foreground">{goal.category}</AppText>
          </View>
        </View>
        <StatusBadge tone={goalStatusTone(status)}>{status}</StatusBadge>
      </View>

      <View className="gap-1.5">
        <View className="flex-row justify-between">
          <AppText className="text-sm text-muted-foreground">Progress</AppText>
          <AppText className="text-sm font-medium" style={{ fontVariant: ["tabular-nums"] }}>
            {(progressPct * 100).toFixed(1)}%
          </AppText>
        </View>
        <ProgressBar value={progressPct * 100} />
      </View>

      <View className="flex-row flex-wrap gap-x-6 gap-y-3">
        <Field label="Saved" value={formatINR(goal.saved_amount)} />
        <Field label="Target" value={formatINR(goal.target_amount)} />
        <Field label="Target Date" value={goal.target_date} />
        <Field label="Priority" value={goal.priority} />
      </View>

      <View className="flex-row justify-end gap-4">
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onEdit(goal)} hitSlop={14}>
          <Pencil size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Edit</AppText>
        </Pressable>
        <Pressable className="flex-row items-center gap-1.5" onPress={() => onDelete(goal.id)} hitSlop={14}>
          <Trash2 size={14} color={accentForeground} />
          <AppText className="text-sm text-muted-foreground">Delete</AppText>
        </Pressable>
      </View>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[40%] gap-0.5">
      <AppText className="text-xs text-muted-foreground">{label}</AppText>
      <AppText className="text-sm font-medium">{value}</AppText>
    </View>
  );
}

export const GoalCard = memo(GoalCardComponent);
