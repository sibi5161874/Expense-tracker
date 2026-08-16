import { useCallback, useState } from "react";
import { Alert, ScrollView, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Target } from "lucide-react-native";
import { useGoals } from "@/hooks/useGoals";
import type { GoalInput } from "@repo/shared/schemas";
import type { Goal } from "@repo/shared/types";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { AppText } from "@/components/common/AppText";
import { GoalCard } from "@/components/goals/GoalCard";
import { AddGoalSheet } from "@/components/goals/AddGoalSheet";
import { useThemeColor } from "@/lib/colors";

export default function GoalsScreen() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const { data: goals, isLoading, error, createGoal, updateGoal, deleteGoal } = useGoals();
  const primary = useThemeColor("primary");

  const handleEdit = useCallback((goal: Goal) => {
    setEditing(goal);
    setSheetOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert("Delete goal?", "This can't be undone.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteGoal(id) },
      ]);
    },
    [deleteGoal]
  );

  async function handleSubmit(data: GoalInput) {
    if (editing) {
      await updateGoal({ id: editing.id, data });
    } else {
      await createGoal(data);
    }
    setSheetOpen(false);
    setEditing(null);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader
          title="Goals"
          description="Track progress toward your savings goals."
          action={
            <Button
              onPress={() => {
                setEditing(null);
                setSheetOpen(true);
              }}
            >
              <Plus size={16} color="white" />
              <AppText className="text-sm font-medium text-primary-foreground">Add</AppText>
            </Button>
          }
        />

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : goals && goals.length > 0 ? (
          <View className="gap-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Set your first savings goal to start tracking progress."
            action={
              <Button onPress={() => setSheetOpen(true)}>
                <Plus size={16} color="white" />
                <AppText className="text-sm font-medium text-primary-foreground">Add Goal</AppText>
              </Button>
            }
          />
        )}
      </ScrollView>

      <AddGoalSheet
        visible={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        editing={
          editing
            ? {
                goal_name: editing.goal_name,
                category: editing.category,
                target_amount: editing.target_amount,
                saved_amount: editing.saved_amount,
                target_date: editing.target_date,
                priority: editing.priority,
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}
