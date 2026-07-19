import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeColor } from "@/lib/colors";

export default function RootIndex() {
  const { user, loading } = useAuth();
  const primary = useThemeColor("primary");

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={primary} />
      </View>
    );
  }

  return <Redirect href={user ? "/(app)/dashboard" : "/(auth)/login"} />;
}
