import { ScrollView, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronRight, FileText } from "lucide-react-native";
import { REPORT_SECTIONS, type ReportLink } from "@/components/reports/reportRegistry";
import { AppText } from "@/components/common/AppText";
import { AppHeader } from "@/components/common/AppHeader";
import { Card } from "@/components/common/Card";
import { useTheme } from "@/theme/ThemeProvider";

export default function ReportsHubScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top"]}
    >
      <AppHeader showBack />
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
            Reports Hub
          </AppText>
          <AppText className="text-xs text-muted-foreground">
            16 comprehensive analytical and tax reports matching web parity
          </AppText>
        </View>

        {/* Report Sections */}
        {REPORT_SECTIONS.map((section) => (
          <View key={section.title} className="gap-2.5">
            <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
              {section.title}
            </AppText>
            <Card variant="outlined" className="p-1 gap-1">
              {section.reports.map((report: ReportLink, idx: number) => {
                const Icon = report.icon;
                return (
                  <Pressable
                    key={report.href}
                    onPress={() => router.push(report.href)}
                    className="flex-row items-center gap-3.5 px-3.5 py-3 rounded-xl active:bg-surface-container-highest/60"
                  >
                    <View
                      className="size-9 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: theme.surfaceContainer || theme.card,
                      }}
                    >
                      <Icon size={18} color={theme.primary} />
                    </View>
                    <View className="flex-1">
                      <AppText className="text-sm font-semibold text-foreground">
                        {report.title}
                      </AppText>
                      <AppText className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                        {report.description}
                      </AppText>
                    </View>
                    <ChevronRight size={18} color={theme.mutedForeground} />
                  </Pressable>
                );
              })}
            </Card>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
