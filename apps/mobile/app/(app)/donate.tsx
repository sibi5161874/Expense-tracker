import { View, Text, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Headless Donate Container
 */
export default function DonateScreen() {
  function handleDonate() {
    Linking.openURL("https://buymeacoffee.com");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff", padding: 16 }}>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Support KashMap</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Help support open-source development and hosting</Text>
        </View>

        <View style={{ padding: 16, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>Buy Me a Coffee</Text>
          <Text style={{ fontSize: 14, color: "#4b5563" }}>
            KashMap is built to empower Indian retail investors with zero ads and complete privacy.
          </Text>
          <Pressable
            onPress={handleDonate}
            style={{ padding: 12, backgroundColor: "#f59e0b", borderRadius: 6, alignItems: "center" }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "bold" }}>Donate via Buy Me a Coffee</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
