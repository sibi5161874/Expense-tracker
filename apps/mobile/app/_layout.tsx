import "../global.css";
import { View } from "react-native";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/lib/QueryProvider";
import { AppText } from "@/components/common/AppText";
import { Button } from "@/components/common/Button";

/** Root-level catch-all — expo-router wraps the whole app in this when any screen throws. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <View className="flex-1 items-center justify-center gap-4 bg-background p-8">
        <AppText className="text-lg font-semibold">Something went wrong</AppText>
        <AppText className="text-center text-sm text-muted-foreground">{error.message}</AppText>
        <Button onPress={retry}>Try again</Button>
      </View>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
        </AuthProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
