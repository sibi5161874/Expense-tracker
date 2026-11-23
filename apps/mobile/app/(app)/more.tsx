import { ScrollView, View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  href: string;
  label: string;
  category?: string;
}

const MENU_ITEMS: NavItem[] = [
  { href: "/investments", label: "Investments Log" },
  { href: "/goals", label: "Financial Goals" },
  { href: "/cashbook", label: "Cashbook & Debtors" },
  { href: "/insurance", label: "Insurance Policies" },
  { href: "/assets", label: "Asset Classes (14 Types)" },
  { href: "/reports", label: "Reports Hub (16 Tax & Analytics)" },
  { href: "/calculators", label: "Financial Calculators" },
  { href: "/config", label: "Accounts & Categories Config" },
  { href: "/billing", label: "Subscription & Billing" },
  { href: "/settings", label: "Settings & Profile" },
  { href: "/feedback", label: "Feedback" },
  { href: "/donate", label: "Donate / Support" },
];

/**
 * Headless More Screen Container
 * Plain unstyled list of secondary routes and authentication controls.
 */
export default function MoreScreen() {
  const { signOut } = useAuth();

  function handleSignOut() {
    Alert.alert("Sign out?", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>More Features</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Access secondary modules, configuration, and tools</Text>
        </View>

        <View style={{ gap: 8, marginTop: 8 }}>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href as any)}
              style={{
                padding: 14,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 6,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "500" }}>{item.label}</Text>
              <Text style={{ color: "#9ca3af" }}>&rarr;</Text>
            </Pressable>
          ))}

          <Pressable
            onPress={handleSignOut}
            style={{
              padding: 14,
              borderWidth: 1,
              borderColor: "#fecaca",
              backgroundColor: "#fef2f2",
              borderRadius: 6,
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <Text style={{ color: "#dc2626", fontWeight: "600" }}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
