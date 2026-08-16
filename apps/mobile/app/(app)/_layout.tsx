import { Redirect, Tabs, router } from "expo-router";
import { View, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutDashboard, Receipt, PieChart, MoreHorizontal, Plus } from "lucide-react-native";
import { useThemeColor } from "@/lib/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
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
  "config",
  "settings",
] as const;

/** Active-tab pill: purple-tinted rounded background behind the icon, not just tinted text. */
function TabIcon({ Icon, focused, color }: { Icon: typeof LayoutDashboard; focused: boolean; color: string }) {
  const accent2Subtle = useThemeColor("accent2");
  return (
    <View
      className="items-center justify-center rounded-full p-2"
      style={{ backgroundColor: focused ? `${accent2Subtle}26` : "transparent" }}
    >
      <Icon color={color} size={20} />
    </View>
  );
}

// Native header is hidden in favor of an in-content header (title + description) matching
// the web PageHeader pattern — a bare native title bar can't carry the description line.
export default function AppLayout() {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useUserProfile();
  const insets = useSafeAreaInsets();
  const primary = useThemeColor("primary");
  const accent2 = useThemeColor("accent2");
  const mutedForeground = useThemeColor("mutedForeground");
  const card = useThemeColor("card");

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
          // Floating glass pill per design spec §5C, not a solid heavy bar — active tab in the
          // secondary (purple) accent, matching the web MobileNav.
          tabBarActiveTintColor: accent2,
          tabBarInactiveTintColor: mutedForeground,
          tabBarStyle: {
            position: "absolute",
            left: 8,
            right: 8,
            // Floats above the home indicator / gesture bar rather than sitting behind it —
            // insets.bottom is 0 on devices with a physical home button, so this still lands
            // at a plain 8px on those.
            bottom: 8 + insets.bottom,
            height: 64,
            borderRadius: 16,
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
            tabBarIcon: ({ color, focused }) => (
              <TabIcon Icon={LayoutDashboard} focused={focused} color={String(color)} />
            ),
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: "Transactions",
            tabBarIcon: ({ color, focused }) => <TabIcon Icon={Receipt} focused={focused} color={String(color)} />,
          }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{
            title: "Portfolio",
            tabBarIcon: ({ color, focused }) => <TabIcon Icon={PieChart} focused={focused} color={String(color)} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: "More",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon Icon={MoreHorizontal} focused={focused} color={String(color)} />
            ),
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
      <Pressable
        onPress={() => router.push("/(app)/transactions")}
        className="absolute right-6 size-14 items-center justify-center rounded-2xl"
        style={{
          bottom: fabBottom,
          backgroundColor: primary,
          shadowColor: primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Plus color="white" size={26} />
      </Pressable>

      {!profileLoading && (!profile || !profile.onboarding_completed) && (
        <OnboardingWizard onDone={() => refetchProfile()} />
      )}
    </View>
  );
}
