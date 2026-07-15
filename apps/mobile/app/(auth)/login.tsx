import { View } from "react-native";
import { AppText } from "@/components/common/AppText";

export default function LoginScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <AppText style={{ fontSize: 18, fontWeight: "600" }}>Mobile sign-in</AppText>
      <AppText style={{ marginTop: 8, textAlign: "center", color: "#666" }}>
        Coming in Phase 4 — mobile auth reuses packages/shared once the web app's flow is validated.
      </AppText>
    </View>
  );
}
