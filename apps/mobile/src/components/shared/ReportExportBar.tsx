import { useState } from "react";
import { Alert, View } from "react-native";
import { router } from "expo-router";
import { FileSpreadsheet, Download, Lock } from "lucide-react-native";
import { useEntitlements } from "@/hooks/useEntitlements";
import { exportReportToPdf } from "@/lib/exportToPdf";
import { exportReportToExcel, type ExcelSheet } from "@/lib/exportToExcel";
import { Button } from "@/components/common/Button";
import { AppText } from "@/components/common/AppText";
import { useThemeColor } from "@/lib/colors";

interface ReportExportBarProps {
  title: string;
  description?: string;
  sheets: ExcelSheet[];
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Mobile equivalent of the export buttons in apps/web/src/components/shared/ReportContainer.tsx
 * — placed by each report screen itself rather than wrapping the whole screen, since mobile
 * report screens already own their layout (PageHeader, ScrollView) and don't share web's
 * ReportContainer abstraction. Excel/PDF gated behind `reportExport` (Pro), same feature key.
 */
export function ReportExportBar({ title, description, sheets }: ReportExportBarProps) {
  const { hasFeature } = useEntitlements();
  const canExport = hasFeature("reportExport");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const foreground = useThemeColor("foreground");

  const hasExportableData = sheets.some((s) => s.rows.length > 0);
  if (!hasExportableData) return null;

  function goToUpgrade() {
    Alert.alert("Pro feature", "Exporting reports is a Pro feature.", [
      { text: "Not now", style: "cancel" },
      { text: "View plans", onPress: () => router.push("/(app)/billing") },
    ]);
  }

  async function handlePdfExport() {
    if (!canExport) return goToUpgrade();
    setIsExportingPdf(true);
    try {
      await exportReportToPdf(title, description ?? "", sheets, slugify(title));
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Couldn't export PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleExcelExport() {
    if (!canExport) return goToUpgrade();
    setIsExportingExcel(true);
    try {
      await exportReportToExcel(slugify(title), sheets);
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Couldn't export Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  }

  return (
    <View className="flex-row gap-2">
      <Button variant="outline" className="flex-1" onPress={handleExcelExport} disabled={isExportingExcel}>
        {canExport ? <FileSpreadsheet size={16} color={foreground} /> : <Lock size={16} color={foreground} />}
        <AppText className="text-sm font-medium">{isExportingExcel ? "Exporting…" : "Excel"}</AppText>
      </Button>
      <Button variant="outline" className="flex-1" onPress={handlePdfExport} disabled={isExportingPdf}>
        {canExport ? <Download size={16} color={foreground} /> : <Lock size={16} color={foreground} />}
        <AppText className="text-sm font-medium">{isExportingPdf ? "Exporting…" : "PDF"}</AppText>
      </Button>
    </View>
  );
}
