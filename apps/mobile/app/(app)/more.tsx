import { ScrollView, View, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";
import {
  TrendingUp,
  Target,
  BookOpen,
  Shield,
  Layers,
  FileText,
  Calculator,
  Sliders,
  CreditCard,
  Settings,
  MessageSquare,
  Heart,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { AppText } from "@/components/common/AppText";
import { Card } from "@/components/common/Card";
import { useTheme } from "@/theme/ThemeProvider";

interface MenuItem {
  href: Href;
  label: string;
  description: string;
  icon: LucideIcon;
}

const FINANCE_MODULES: MenuItem[] = [
  { href: "/investments", label: "Investments Log", description: "Trade records, buys & sells", icon: TrendingUp },
  { href: "/goals", label: "Financial Goals", description: "Savings targets & milestones", icon: Target },
  { href: "/cashbook", label: "Cashbook & Debtors", description: "Personal debts & receivables", icon: BookOpen },
  { href: "/insurance", label: "Insurance Policies", description: "Health, term & vehicle coverage", icon: Shield },
  { href: "/assets", label: "Asset Classes", description: "14 wealth asset categories", icon: Layers },
  { href: "/reports", label: "Reports Hub", description: "16 analytical and tax reports", icon: FileText },
  { href: "/calculators", label: "Calculators", description: "SIP, EMI, PPF & compound interest", icon: Calculator },
];

const CONFIG_MODULES: MenuItem[] = [
  { href: "/config", label: "Accounts & Categories", description: "Manage bank accounts and category tags", icon: Sliders },
  { href: "/settings", label: "Settings & Appearance", description: "M3 theme modes & PRISM accents", icon: Settings },
  { href: "/billing", label: "Subscription & Plans", description: "Manage Pro membership & features", icon: CreditCard },
  { href: "/feedback", label: "Feedback & Roadmap", description: "Send bug reports or feature ideas", icon: MessageSquare },
  { href: "/donate", label: "Support Development", description: "Support the open-source creators", icon: Heart },
];

export default function MoreScreen() {
  const { signOut, user } = useAuth();
  const { theme } = useTheme();

  function handleSignOut() {
    Alert.alert("Sign out?", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 96,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="gap-1">
          <AppText className="text-2xl font-bold tracking-tight text-foreground">
            More
          </AppText>
          <AppText className="text-xs text-muted-foreground">
            Signed in as {user?.email || "User"}
          </AppText>
        </View>

        {/* Section 1: Financial Tools & Modules */}
        <View className="gap-2.5">
          <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Financial Modules
          </AppText>
          <Card variant="outlined" className="p-1 gap-1">
            {FINANCE_MODULES.map((item) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.href as string}
                  onPress={() => router.push(item.href)}
                  className="flex-row items-center gap-3.5 px-3.5 py-3 rounded-xl active:bg-surface-container-highest/60"
                >
                  <View
                    className="size-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: theme.surfaceContainer || theme.card }}
                  >
                    <Icon size={18} color={theme.primary} />
                  </View>
                  <View className="flex-1">
                    <AppText className="text-sm font-semibold text-foreground">
                      {item.label}
                    </AppText>
                    <AppText className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </AppText>
                  </View>
                  <ChevronRight size={18} color={theme.mutedForeground} />
                </Pressable>
              );
            })}
          </Card>
        </View>

        {/* Section 2: Configuration & Settings */}
        <View className="gap-2.5">
          <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            System & Settings
          </AppText>
          <Card variant="outlined" className="p-1 gap-1">
            {CONFIG_MODULES.map((item) => {
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.href as string}
                  onPress={() => router.push(item.href)}
                  className="flex-row items-center gap-3.5 px-3.5 py-3 rounded-xl active:bg-surface-container-highest/60"
                >
                  <View
                    className="size-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: theme.surfaceContainer || theme.card }}
                  >
                    <Icon size={18} color={theme.primary} />
                  </View>
                  <View className="flex-1">
                    <AppText className="text-sm font-semibold text-foreground">
                      {item.label}
                    </AppText>
                    <AppText className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </AppText>
                  </View>
                  <ChevronRight size={18} color={theme.mutedForeground} />
                </Pressable>
              );
            })}
          </Card>
        </View>

        {/* Sign Out Button */}
        <Pressable
          onPress={handleSignOut}
          className="flex-row items-center justify-center gap-2 rounded-2xl border p-4 active:bg-destructive-subtle/40"
          style={{
            borderColor: theme.destructive,
            backgroundColor: theme.destructiveSubtle || "transparent",
          }}
        >
          <LogOut size={18} color={theme.destructive} />
          <AppText className="text-sm font-bold text-destructive">Sign Out</AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
