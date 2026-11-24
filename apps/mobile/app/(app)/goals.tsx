import { useState } from "react";
import { View, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Target } from "lucide-react-native";
import { useGoals } from "@/hooks/useGoals";
import type { Goal } from "@repo/shared/types";
import type { GoalInput } from "@repo/shared/schemas";

import { AppText } from "@/components/common/AppText";
import { Fab } from "@/components/common/Fab";
import { GoalCard } from "@/components/goals/GoalCard";
import { AddGoalSheet } from "@/components/goals/AddGoalSheet";
import { useTheme } from "@/theme/ThemeProvider";

export default function GoalsScreen() {
  const { theme } = useTheme();
  const [showAdd, setShowAdd] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalInput | undefined>(undefined);

  const { data: goals, isLoading, error, createGoal, updateGoal, deleteGoal } = useGoals();

  const goalList = goals ?? [];

  const handleEdit = (goal: Goal) => {
    setEditingGoal({
      goal_name: goal.goal_name,
      category: goal.category,
      target_amount: goal.target_amount,
      saved_amount: goal.saved_amount,
      target_date: goal.target_date,
      priority: goal.priority,
    });
    setShowAdd(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Goal", "Are you sure you want to delete this goal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteGoal(id),
      },
    ]);
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 96,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="gap-1">
          <AppText className="text-2xl font-bold tracking-tight text-foreground">
            Financial Goals
          </AppText>
          <AppText className="text-xs text-muted-foreground">
            {goalList.length} active savings targets & milestones
          </AppText>
        </View>

        {isLoading && (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        )}

        {error && (
          <View
            className="rounded-2xl border p-4"
            style={{
              backgroundColor: theme.destructiveSubtle || "#fee2e2",
              borderColor: theme.destructive,
            }}
          >
            <AppText className="text-xs text-destructive">{error.message}</AppText>
          </View>
        )}

        {goalList.length === 0 && !isLoading ? (
          <View className="items-center justify-center p-8 gap-3">
            <View
              className="size-16 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.surfaceContainerHighest }}
            >
              <Target size={28} color={theme.mutedForeground} />
            </View>
            <AppText className="text-base font-semibold text-foreground">
              No financial goals yet
            </AppText>
            <AppText className="text-center text-xs text-muted-foreground">
              Tap '+' below to set up an emergency fund, travel or wealth goal.
            </AppText>
          </View>
        ) : (
          <View className="gap-3">
            {goalList.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Goal FAB */}
      <View className="absolute bottom-6 right-5">
        <Fab
          icon={<Plus size={24} color={theme.onPrimary} />}
          onPress={() => {
            setEditingGoal(undefined);
            setShowAdd(true);
          }}
        />
      </View>

      {/* Add / Edit Goal Bottom Sheet */}
      <AddGoalSheet
        visible={showAdd}
        onClose={() => {
          setShowAdd(false);
          setEditingGoal(undefined);
        }}
        editing={editingGoal}
        onSubmit={async (data) => {
          await createGoal(data);
          setShowAdd(false);
          setEditingGoal(undefined);
        }}
      />
    </SafeAreaView>
  );
}
