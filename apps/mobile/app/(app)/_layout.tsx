import type { ReactNode } from "react";
import { Redirect, Tabs, router } from "expo-router";
import { View, ActivityIndicator, Pressable, Animated, type GestureResponderEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutDashboard, Receipt, PieChart, MoreHorizontal, Plus } from "lucide-react-native";
import { useThemeColor } from "@/lib/colors";
import { useTheme } from "@/theme/ThemeProvider";
import { usePressScale } from "@/theme/usePressScale";
import { Fab } from "@/components/common/Fab";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useGenerateRecurringTransactions } from "@/hooks/useGenerateRecurringTransactions";
import { OfflineBanner } from "@/components/common/OfflineBanner";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

/** Routes that live in this tab navigator (so the floating tab bar stays visible on them)
 * but aren't primary destinations — reached via the More screen, hidden from the tab bar
 * with `href: null`. */
const HIDDEN_ROUTES = [
  "investments",
  "goals",
  "cashbook",
  "insurance",
  "assets",
  "reports",
  "net-worth-report",
  "category-breakdown-report",
  "monthly-summary-report",
  "budget-vs-actual-report",
  "spending-trend-report",
  "account-flow-report",
  "year-in-review-report",
  "asset-allocation-report",
  "dividend-income-report",
  "best-worst-performers-report",
  "cashbook-net-position-report",
  "asset-maturity-calendar-report",
  "goal-progress-report",
  "overall-report",
  "calculators",
  "stock-detail",
  "transactions-date",
  "config",
  "settings",
  "billing",
] as const;

/** Active-tab pill: Primary Container behind the icon, not just tinted text — matches the
 * brief's "Active state: background is Primary Container, icon/text is Primary" spec.
 * Previously used the fixed decorative accent2 (purple) regardless of the user's chosen
 * PRISM OPS accent; now tracks whichever accent is selected. */
function TabIcon({ Icon, focused }: { Icon: typeof LayoutDashboard; focused: boolean }) {
  const { theme } = useTheme();
  return (
    <View
      className="items-center justify-center rounded-full p-2"
      style={{ backgroundColor: focused ? theme.primaryContainer : "transparent" }}
    >
      <Icon color={focused ? theme.primary : theme.mutedForeground} size={20} />
    </View>
  );
}

/** Wraps each tab bar button with the shared press-and-lift scale — React Navigation's
 * bottom tabs let a screen override the touchable entirely via `tabBarButton`. */
function TabBarButton({ children, onPress }: { children: ReactNode; onPress?: (e: GestureResponderEvent) => void }) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  return (
    <Animated.View style={[{ flex: 1, alignItems: "center", justifyContent: "center" }, animatedStyle]}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} className="items-center justify-center">
        {children}
      </Pressable>
    </Animated.View>
  );
}

// Native header is hidden in favor of an in-content header (title + description) matching
// the web PageHeader pattern — a bare native title bar can't carry the description line.
export default function AppLayout() {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useUserProfile();
  useGenerateRecurringTransactions();
  const insets = useSafeAreaInsets();
  const primary = useThemeColor("primary");
  const mutedForeground = useThemeColor("mutedForeground");
  const card = useThemeColor("card");
  const { theme } = useTheme();

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

  // FAB floats 16px above the tab bar's top edge (tab bar bottom-offset + its own height).
  const fabBottom = 8 + insets.bottom + 64 + 16;

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          // Active tab now tracks the user's chosen PRISM OPS accent (via TabIcon/theme),
          // not the fixed decorative accent2 — these two tint props still drive the label
          // text color for whichever tabs show a label.
          tabBarActiveTintColor: primary,
          tabBarInactiveTintColor: mutedForeground,
          tabBarButton: (props) => <TabBarButton {...props} />,
          tabBarStyle: {
            position: "absolute",
            left: 8,
            right: 8,
            // Floats above the home indicator / gesture bar rather than sitting behind it —
            // insets.bottom is 0 on devices with a physical home button, so this still lands
            // at a plain 8px on those.
            bottom: 8 + insets.bottom,
            height: 64,
            // True pill (radius >= height/2), not a rounded rectangle — matches the brief's
            // "Floating Segmented Pill Navigation" literally, not just a bar with soft corners.
            borderRadius: 32,
            borderTopWidth: 0,
            backgroundColor: card,
            opacity: 0.96,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ focused }) => <TabIcon Icon={LayoutDashboard} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: "Transactions",
            tabBarIcon: ({ focused }) => <TabIcon Icon={Receipt} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{
            title: "Portfolio",
            tabBarIcon: ({ focused }) => <TabIcon Icon={PieChart} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: "More",
            tabBarIcon: ({ focused }) => <TabIcon Icon={MoreHorizontal} focused={focused} />,
          }}
        />
        {HIDDEN_ROUTES.map((name) => (
          <Tabs.Screen key={name} name={name} options={{ href: null }} />
        ))}
      </Tabs>

      <View className="absolute inset-x-0 top-0" style={{ paddingTop: insets.top }}>
        <OfflineBanner />
      </View>

      {/* Primary action — quick add. Navigates to Transactions rather than deep-linking
          straight into its Add sheet, which would need cross-screen state wiring. */}
      <Fab
        icon={<Plus color={theme.onPrimary} size={26} />}
        onPress={() => router.push("/(app)/transactions")}
        style={{ position: "absolute", right: 24, bottom: fabBottom }}
      />

      {!profileLoading && (!profile || !profile.onboarding_completed) && (
        <OnboardingWizard onDone={() => refetchProfile()} />
      )}
    </View>
  );
}
