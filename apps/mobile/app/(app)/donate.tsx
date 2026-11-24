import { View, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Coffee, Heart } from "lucide-react-native";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 Donate Screen
 */
export default function DonateScreen() {
  const { theme } = useTheme();

  function handleDonate() {
    Linking.openURL("https://buymeacoffee.com");
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      <View className="p-4 gap-4">
        <PageHeader
          title="Support KashMap"
          description="Help sustain open-source development and cloud infrastructure"
        />

        <Card variant="elevated" className="p-6 gap-4 border border-outline-variant/50">
          <View className="size-12 rounded-2xl bg-amber-500/15 items-center justify-center">
            <Coffee size={24} color="#f59e0b" />
          </View>

          <View className="gap-1.5">
            <AppText className="text-xl font-bold text-foreground">
              Buy Us a Coffee
            </AppText>
            <AppText className="text-sm text-muted-foreground leading-5">
              KashMap is meticulously built to empower Indian retail investors with zero advertising, zero trackers, and uncompromising privacy.
            </AppText>
          </View>

          <Button
            variant="primary"
            size="lg"
            className="w-full flex-row items-center justify-center gap-2 mt-2"
            onPress={handleDonate}
          >
            <Heart size={18} color={theme.onPrimary} />
            <AppText className="font-semibold text-primary-foreground">
              Donate via Buy Me a Coffee
            </AppText>
          </Button>
        </Card>
      </View>
    </SafeAreaView>
  );
}
