import { ScrollView, View, Pressable } from "react-native";
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
  MessageSquare,
  Heart,
  ChevronRight,
  type LucideIcon,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { AppText } from "@/components/common/AppText";
import { Card } from "@/components/common/Card";
import { AppHeader } from "@/components/common/AppHeader";
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

const COMMUNITY_MODULES: MenuItem[] = [
  { href: "/feedback", label: "Feedback & Roadmap", description: "Send bug reports or feature ideas", icon: MessageSquare },
  { href: "/donate", label: "Support Development", description: "Support the creators and project", icon: Heart },
];

export default function MoreScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top"]}
    >
      <AppHeader title="Hub & Modules" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 96,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Financial Tools & Modules */}
        <View className="gap-2.5">
          <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Financial & Wealth Modules
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

        {/* Section 2: Community & Growth */}
        <View className="gap-2.5">
          <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Community & Support
          </AppText>
          <Card variant="outlined" className="p-1 gap-1">
            {COMMUNITY_MODULES.map((item) => {
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
      </ScrollView>
    </SafeAreaView>
  );
}
