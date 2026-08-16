import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { useThemeColor } from "@/lib/colors";
import { REPORT_SECTIONS } from "@/components/reports/reportRegistry";

export default function ReportsScreen() {
  const mutedForeground = useThemeColor("mutedForeground");
  const accentForeground = useThemeColor("accentForeground");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 p-4 pb-32">
        <PageHeader title="Reports" description="Read-only summaries computed from your data." />

        {REPORT_SECTIONS.map((section) => (
          <View key={section.title} className="gap-3">
            <AppText className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {section.title}
            </AppText>
            <View className="gap-2">
              {section.reports.map((report) => (
                <Pressable
                  key={report.href}
                  onPress={() => router.push(report.href)}
                  className="flex-row items-center gap-3 rounded-2xl bg-card p-4 active:opacity-70"
                >
                  <View className="size-9 items-center justify-center rounded-full bg-accent">
                    <report.icon size={18} color={accentForeground} />
                  </View>
                  <View className="flex-1">
                    <AppText className="text-sm font-medium">{report.title}</AppText>
                    <AppText className="text-xs text-muted-foreground">{report.description}</AppText>
                  </View>
                  <ChevronRight size={18} color={mutedForeground} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
