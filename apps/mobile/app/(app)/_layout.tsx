import { Redirect, Tabs } from "expo-router";
import { View, ActivityIndicator, Easing } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useGenerateRecurringTransactions } from "@/hooks/useGenerateRecurringTransactions";
import { BottomNav } from "@/components/common/BottomNav";
import { useTheme } from "@/theme/ThemeProvider";

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
  "donate",
  "feedback",
] as const;

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  useGenerateRecurringTransactions();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Tabs
        tabBar={(props) => <BottomNav {...props} />}
        screenOptions={{
          headerShown: false,
          animation: "shift",
          sceneStyle: { backgroundColor: theme.background },
          transitionSpec: {
            animation: "timing",
            config: {
              duration: 150,
              easing: Easing.inOut(Easing.ease),
            },
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: "Transactions",
          }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{
            title: "Portfolio",
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: "More",
          }}
        />
        {HIDDEN_ROUTES.map((name) => (
          <Tabs.Screen key={name} name={name} options={{ href: null }} />
        ))}
      </Tabs>
    </View>
  );
}
