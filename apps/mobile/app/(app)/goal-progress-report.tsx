import { ActivityIndicator, ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGoals } from "@/hooks/useGoals";
import { calculateProgressPct, calculateGoalStatus } from "@repo/shared/logic";

/**
 * Headless Goal Progress Report Container
 */
export default function GoalProgressReportScreen() {
  const { data: goals, isLoading, error } = useGoals();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Goal Progress</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Savings vs targets across all tracked goals</Text>
        </View>

        {isLoading && <ActivityIndicator />}
        {error && <Text style={{ color: "#b91c1c" }}>{error.message}</Text>}

        <View style={{ gap: 8 }}>
          {goals?.map((g) => {
            const progressPct = calculateProgressPct(g.saved_amount, g.target_amount);
            const status = calculateGoalStatus(g.saved_amount, g.target_amount, g.target_date);
            return (
              <View
                key={g.id}
                style={{ padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, gap: 4 }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontWeight: "bold" }}>{g.goal_name}</Text>
                  <Text style={{ fontWeight: "600", color: "#2563eb" }}>{status}</Text>
                </View>
                <Text style={{ fontSize: 13, color: "#4b5563" }}>
                  Saved: ₹{g.saved_amount.toLocaleString("en-IN")} / ₹{g.target_amount.toLocaleString("en-IN")} ({Math.round(progressPct * 100)}%)
                </Text>
                <Text style={{ fontSize: 11, color: "#9ca3af" }}>Target Date: {g.target_date}</Text>
              </View>
            );
          })}
          {!isLoading && (!goals || goals.length === 0) && (
            <Text style={{ color: "#6b7280" }}>No goals found.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
