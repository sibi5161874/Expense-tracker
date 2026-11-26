import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/theme/ThemeProvider";

export default function RootIndex() {
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const val = await AsyncStorage.getItem("@kashmap/has-seen-onboarding");
        setHasSeenOnboarding(val === "true");
      } catch {
        setHasSeenOnboarding(false);
      }
    }
    checkOnboarding();
  }, []);

  if (authLoading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/dashboard" />;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/login" />;
}
