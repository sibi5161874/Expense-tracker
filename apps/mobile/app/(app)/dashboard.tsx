import { View } from "react-native";
import { AppText } from "@/components/common/AppText";

export default function DashboardScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <AppText style={{ fontSize: 18, fontWeight: "600" }}>Dashboard</AppText>
      <AppText style={{ marginTop: 8, textAlign: "center", color: "#666" }}>
        Net worth, monthly totals, and budget alerts land here in Phase 4, reusing the
        same packages/shared logic and types as the web dashboard.
      </AppText>
    </View>
  );
}
