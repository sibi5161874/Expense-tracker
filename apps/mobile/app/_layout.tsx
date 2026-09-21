import "../global.css";
import { useEffect } from "react";
import { View } from "react-native";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/lib/QueryProvider";
import { AppText } from "@/components/common/AppText";
import { Button } from "@/components/common/Button";
import { loadThemePreference } from "@/lib/themePreference";
import { ThemeProvider } from "@/theme/ThemeProvider";

/** Root-level catch-all — expo-router wraps the whole app in this when any screen throws. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <View className="flex-1 items-center justify-center gap-4 bg-background p-8">
          <AppText className="text-lg font-semibold">Something went wrong</AppText>
          <AppText className="text-center text-sm text-muted-foreground">{error.message}</AppText>
          <Button onPress={retry}>Try again</Button>
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  // Applies the user's saved light/dark/system choice before anything else renders —
  // otherwise every screen would briefly flash the OS default first.
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Gated on fontError too, not just fontsLoaded — a failed font fetch (offline first
  // launch, CDN hiccup) must fall through to the OS default font, never leave the app
  // stuck on a blank screen forever waiting for Inter.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }} />
            <StatusBar style="auto" />
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
