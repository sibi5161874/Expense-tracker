import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { LucideIcon } from "lucide-react-native";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";

interface ComingSoonScreenProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

/** Placeholder for a feature screen not yet ported to mobile — swapped for the real
 * screen in its own phase (see task tracker). Keeps navigation fully wired up now. */
export function ComingSoonScreen({ title, description, icon }: ComingSoonScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="gap-6 p-4">
        <PageHeader title={title} />
        <EmptyState icon={icon} title="Coming soon" description={description} />
      </View>
    </SafeAreaView>
  );
}
