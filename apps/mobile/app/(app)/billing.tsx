import { View, ScrollView, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react-native";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PRICING } from "@repo/shared/config";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { AppText } from "@/components/common/AppText";
import { StatusBadge } from "@/components/common/Badge";
import { useTheme } from "@/theme/ThemeProvider";

const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL || "https://web-six-beta-34.vercel.app";

const PRO_PERKS = [
  "Bank Statement PDF/Excel Automatic Import",
  "Broker CAS & Tradebook Parser (Zerodha, Groww, Angel)",
  "Capital Gains STCG / LTCG Tax Reports (FIFO)",
  "Real-Time Nifty 50 & Stock Price Refresh",
  "Export all 16 Financial Reports to Excel & PDF",
  "Priority AI Financial Assistant Chat",
];

/**
 * Material 3 Billing Screen
 * Subscription tier, trial status, and lifetime checkout link.
 */
export default function BillingScreen() {
  const { theme } = useTheme();
  const { data: profile, isLoading } = useUserProfile();
  const { tier, isPro, isTrialing, trialDaysRemaining } = useEntitlements();

  function openCheckout() {
    Linking.openURL(`${WEB_APP_URL}/pricing`);
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Billing & Pro"
          description="Manage your subscription and lifetime access"
        />

        {isLoading && <ActivityIndicator color={theme.primary} />}

        {/* Current Plan Status Card */}
        <Card variant="outlined" className="p-5 gap-3">
          <View className="flex-row items-center justify-between">
            <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current Membership
            </AppText>
            <StatusBadge tone={isPro ? "success" : isTrialing ? "info" : "neutral"}>
              {tier.toUpperCase()}
            </StatusBadge>
          </View>

          <View className="flex-row items-center gap-2.5">
            <ShieldCheck size={26} color={isPro ? theme.success : theme.primary} />
            <AppText className="text-2xl font-bold text-foreground capitalize">
              {tier} Plan
            </AppText>
          </View>

          {isTrialing && (
            <View className="rounded-xl bg-primary/10 p-3 flex-row items-center gap-2">
              <Zap size={16} color={theme.primary} />
              <AppText className="text-sm font-medium text-primary">
                Free Trial Active: {trialDaysRemaining} days remaining
              </AppText>
            </View>
          )}

          {isPro && (
            <View className="rounded-xl bg-success/10 p-3 flex-row items-center gap-2">
              <CheckCircle2 size={16} color={theme.success} />
              <AppText className="text-sm font-medium text-success">
                Lifetime License Active — All Features Unlocked Forever
              </AppText>
            </View>
          )}
        </Card>

        {/* Upgrade Card */}
        {!isPro && (
          <Card variant="elevated" className="p-5 gap-5 border border-primary/30">
            <View className="flex-row items-center gap-2">
              <Sparkles size={22} color={theme.primary} />
              <AppText className="text-lg font-bold text-foreground">
                KashMap Pro — Lifetime Deal
              </AppText>
            </View>

            <AppText className="text-sm text-muted-foreground leading-5">
              Empower your Indian wealth journey with enterprise analytics, automated bank imports, and tax computation.
            </AppText>

            {/* Perks List */}
            <View className="gap-2.5">
              {PRO_PERKS.map((perk, i) => (
                <View key={i} className="flex-row items-center gap-2.5">
                  <CheckCircle2 size={16} color={theme.success} />
                  <AppText className="text-sm text-foreground flex-1">
                    {perk}
                  </AppText>
                </View>
              ))}
            </View>

            {/* Pricing Section */}
            <View className="pt-3 border-t border-border/60 flex-row items-baseline gap-2">
              <AppText className="text-3xl font-bold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                ₹{PRICING.lifetime.priceRupees}
              </AppText>
              <AppText className="text-sm text-muted-foreground">
                one-time payment, lifetime updates
              </AppText>
            </View>

            <Button
              variant="primary"
              size="lg"
              className="w-full flex-row items-center justify-center gap-2"
              onPress={openCheckout}
            >
              <Zap size={18} color={theme.onPrimary} />
              <AppText className="font-semibold text-primary-foreground">
                Upgrade to Lifetime Pro
              </AppText>
            </Button>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
