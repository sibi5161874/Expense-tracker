import { ScrollView, View, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  TrendingUp,
  Target,
  Users,
  ShieldCheck,
  Landmark,
  FileBarChart,
  Cog,
  Settings,
  CreditCard,
  Calculator,
  LogOut,
  type LucideIcon,
} from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeColor } from "@/lib/colors";

interface MoreMenuItem {
  href:
    | "/(app)/investments"
    | "/(app)/goals"
    | "/(app)/cashbook"
    | "/(app)/insurance"
    | "/(app)/assets"
    | "/(app)/reports"
    | "/(app)/config"
    | "/(app)/settings"
    | "/(app)/billing"
    | "/(app)/calculators";
  label: string;
  icon: LucideIcon;
}

const MENU_ITEMS: MoreMenuItem[] = [
  { href: "/(app)/investments", label: "Investments", icon: TrendingUp },
  { href: "/(app)/goals", label: "Goals", icon: Target },
  { href: "/(app)/cashbook", label: "Cashbook", icon: Users },
  { href: "/(app)/insurance", label: "Insurance", icon: ShieldCheck },
  { href: "/(app)/reports", label: "Reports", icon: FileBarChart },
  { href: "/(app)/assets", label: "Assets", icon: Landmark },
  { href: "/(app)/calculators", label: "Calculators", icon: Calculator },
  { href: "/(app)/config", label: "Config", icon: Cog },
  { href: "/(app)/billing", label: "Billing", icon: CreditCard },
  { href: "/(app)/settings", label: "Settings", icon: Settings },
];

/** Grid menu for everything that doesn't fit as a primary bottom-tab destination — mirrors
 * the web MobileNav's "More" bottom sheet, but as a full screen (RN-idiomatic over a JS overlay). */
export default function MoreScreen() {
  const { signOut } = useAuth();
  const destructive = useThemeColor("destructive");

  function handleSignOut() {
    Alert.alert("Sign out?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 p-4 pb-32">
        <PageHeader title="More" />

        <View className="flex-row flex-wrap gap-3">
          {MENU_ITEMS.map((item) => (
            <MenuTile key={item.href} {...item} onPress={() => router.push(item.href)} />
          ))}
          <MenuTile label="Sign out" icon={LogOut} onPress={handleSignOut} tintColor={destructive} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuTile({
  label,
  icon: Icon,
  onPress,
  tintColor,
}: {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  tintColor?: string;
}) {
  const foreground = useThemeColor("foreground");

  return (
    <Pressable
      onPress={onPress}
      className="w-[30%] items-center gap-2 rounded-2xl bg-card px-2 py-5 active:opacity-70"
    >
      <Icon size={24} color={tintColor ?? foreground} />
      <AppText className="text-center text-xs font-medium" style={tintColor ? { color: tintColor } : undefined}>
        {label}
      </AppText>
    </Pressable>
  );
}
