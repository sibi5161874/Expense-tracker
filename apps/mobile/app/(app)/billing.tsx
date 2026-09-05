import { useCallback } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { useThemeColor } from "@/lib/colors";

const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL;

/**
 * Reuses apps/web's Razorpay checkout inside a WebView rather than reimplementing it
 * natively — there's no Razorpay React Native SDK compatible with Expo Go. The WebView
 * loads `${WEB_APP_URL}/mobile-checkout`, a bridge page that establishes the same
 * Supabase session client-side from tokens passed in the URL hash (see that page's own
 * header comment for why the hash, not a query param), then renders the exact BillingTab
 * component web's own Settings → Billing tab uses — one plan UI, one checkout flow.
 */
export default function BillingScreen() {
  const { session, user } = useAuth();
  const { tier } = useEntitlements();
  const queryClient = useQueryClient();
  const primary = useThemeColor("primary");

  // The checkout that actually changes `tier` happens inside the WebView's own JS
  // context, invisible to this screen's React state — re-fetching the profile whenever
  // this screen regains focus (e.g. the user backs out after finishing checkout) is what
  // picks up the change, rather than any state passed back out of the WebView.
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", user?.id] });
    }, [queryClient, user?.id])
  );

  if (!WEB_APP_URL) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="gap-4 p-4">
          <PageHeader title="Billing" description="Manage your plan." />
          <AppText className="text-sm text-destructive">
            EXPO_PUBLIC_WEB_APP_URL is not configured — billing needs the deployed web app's
            URL to load checkout.
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={primary} />
      </SafeAreaView>
    );
  }

  const checkoutUrl = `${WEB_APP_URL}/mobile-checkout#access_token=${encodeURIComponent(
    session.access_token
  )}&refresh_token=${encodeURIComponent(session.refresh_token)}`;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="p-4 pb-2">
        <PageHeader title="Billing" description={`Current plan: ${tier === "pro" ? "Pro" : tier === "trial" ? "Trial" : "Free"}`} />
      </View>
      <WebView
        source={{ uri: checkoutUrl }}
        style={{ flex: 1 }}
        startInLoadingState
        renderLoading={() => (
          <View className="absolute inset-0 items-center justify-center bg-background">
            <ActivityIndicator color={primary} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
