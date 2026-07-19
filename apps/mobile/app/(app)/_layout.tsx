import { Redirect, Tabs } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { LayoutDashboard, Receipt } from "lucide-react-native";
import { useThemeColor } from "@/lib/colors";
import { useAuth } from "@/contexts/AuthContext";

// Native header is hidden in favor of an in-content header (title + description) matching
// the web PageHeader pattern — a bare native title bar can't carry the description line.
export default function AppLayout() {
  const { user, loading } = useAuth();
  const primary = useThemeColor("primary");
  const mutedForeground = useThemeColor("mutedForeground");
  const background = useThemeColor("background");
  const border = useThemeColor("border");

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primary,
        tabBarInactiveTintColor: mutedForeground,
        tabBarStyle: { backgroundColor: background, borderTopColor: border },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: "Dashboard", tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="transactions"
        options={{ title: "Transactions", tabBarIcon: ({ color, size }) => <Receipt color={color} size={size} /> }}
      />
    </Tabs>
  );
}
