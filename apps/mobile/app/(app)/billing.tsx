import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PRICING } from "@repo/shared/config";

const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL || "https://kashmap.in";

/**
 * Headless Billing Container
 * Pure functional data container for subscription tier, trial status, and lifetime checkout link.
 */
export default function BillingScreen() {
  const { data: profile, isLoading } = useUserProfile();
  const { tier, isPro, isTrialing, trialDaysRemaining } = useEntitlements();

  function openCheckout() {
    Linking.openURL(`${WEB_APP_URL}/pricing`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Billing & Entitlements</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Manage your subscription and Pro access</Text>
        </View>

        {isLoading && <ActivityIndicator />}

        {/* Current Plan */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
            Current Status
          </Text>
          <Text style={{ fontSize: 22, fontWeight: "bold", textTransform: "uppercase" }}>{tier} Tier</Text>
          {isTrialing && (
            <Text style={{ fontSize: 14, color: "#2563eb" }}>Trial Active: {trialDaysRemaining} days remaining</Text>
          )}
          {isPro && (
            <Text style={{ fontSize: 14, color: "#16a34a" }}>Lifetime License Active — All Features Unlocked</Text>
          )}
        </View>

        {/* Pricing Options */}
        {!isPro && (
          <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Upgrade to Pro (Lifetime)</Text>
            <Text style={{ fontSize: 14, color: "#4b5563" }}>
              Unlock Bank Statement Import, Broker CAS Parser, Capital Gains Tax Reports, and Live Portfolio Valuation.
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>₹{PRICING.lifetime.priceRupees} one-time</Text>

            <Pressable
              onPress={openCheckout}
              style={{ padding: 12, backgroundColor: "#16a34a", borderRadius: 6, alignItems: "center" }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "600" }}>Upgrade to Lifetime Pro</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
