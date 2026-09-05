'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProLockedButton } from '@/components/shared/ProGate';
import { useEntitlements } from '@/hooks/useEntitlements';
import { ReportEmbedContext, type ReportEmbedRegistry } from '@/components/shared/ReportContainer';
import type { ExcelSheet } from '@/lib/exportToExcel';
import { REPORTS } from '@/lib/reportsRegistry';
import { MonthlySummaryReport } from '@/components/reports/MonthlySummaryReport';
import { BudgetVsActualReport } from '@/components/reports/BudgetVsActualReport';
import { CategoryBreakdownReport } from '@/components/reports/CategoryBreakdownReport';
import { SpendingTrendReport } from '@/components/reports/SpendingTrendReport';
import { AccountFlowReport } from '@/components/reports/AccountFlowReport';
import { YearInReviewReport } from '@/components/reports/YearInReviewReport';
import { PortfolioSummaryReport } from '@/components/reports/PortfolioSummaryReport';
import { AssetAllocationReport } from '@/components/reports/AssetAllocationReport';
import { DividendIncomeReport } from '@/components/reports/DividendIncomeReport';
import { BestWorstPerformersReport } from '@/components/reports/BestWorstPerformersReport';
import { NetWorthReport } from '@/components/reports/NetWorthReport';
import { CashbookNetPositionReport } from '@/components/reports/CashbookNetPositionReport';
import { AssetMaturityCalendarReport } from '@/components/reports/AssetMaturityCalendarReport';
import { GoalProgressReport } from '@/components/reports/GoalProgressReport';

/**
 * Reports register as their data resolves, so registration order is whatever finishes
 * loading first. This pins the PDF to the registry's canonical order instead, so the
 * document reads the same every time regardless of network timing.
 */
const REPORT_ORDER = new Map(REPORTS.map((r, i) => [r.title, i]));

export default function OverallReportPage() {
  const router = useRouter();
  const { hasFeature } = useEntitlements();
  const canExport = hasFeature('reportExport');
  const [isExporting, setIsExporting] = useState(false);

  // A ref, not state: registration happens during child effects on every render, and
  // writing to state there would re-render the children and loop. Nothing reads this
  // during render — only the click handler does, by which point it's fully populated.
  const sheetsRef = useRef(new Map<string, ExcelSheet[]>());

  const registry = useMemo<ReportEmbedRegistry>(
    () => ({
      register: (title, sheets) => {
        sheetsRef.current.set(title, sheets);
      },
    }),
    []
  );

  function goToUpgrade() {
    toast.info('Exporting reports is a Pro feature — start your free trial to unlock it.');
    router.push('/settings?tab=billing');
  }

  // Dynamically imported — see ReportContainer.tsx's handlePdfExport for why: this route
  // only pulls in jsPDF at the moment Export is actually clicked, not on every page load.
  async function handleExport() {
    const collected = [...sheetsRef.current.entries()]
      .sort(([a], [b]) => (REPORT_ORDER.get(a) ?? Infinity) - (REPORT_ORDER.get(b) ?? Infinity))
      .flatMap(([reportTitle, sheets]) =>
        // A report with a single sheet reads better under its own name; one with several
        // needs both, or the PDF would show the same heading two or three times running.
        sheets.map((sheet) => ({
          ...sheet,
          name: sheets.length > 1 ? `${reportTitle} — ${sheet.name}` : reportTitle,
        }))
      );

    if (collected.length === 0) {
      toast.info('Nothing to export yet — add some transactions or assets first.');
      return;
    }

    setIsExporting(true);
    try {
      const { exportReportToPdf } = await import('@/lib/exportToPdf');
      exportReportToPdf(
        'Overall Report',
        'Every report combined into one document.',
        collected,
        'overall-report'
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Overall Report"
        description="Every report combined into one document."
        action={
          canExport ? (
            <Button onClick={handleExport} disabled={isExporting}>
              <Download className="size-4" />
              {isExporting ? 'Exporting...' : 'Download PDF'}
            </Button>
          ) : (
            // Without this the combined export would be a way to get all 14 reports out
            // on the free tier while each individual report's export stays gated.
            <ProLockedButton label="Download PDF" onUpgradeClick={goToUpgrade} />
          )
        }
      />

      <ReportEmbedContext.Provider value={registry}>
        <div className="bg-background space-y-10 p-1">
          <MonthlySummaryReport />
          <BudgetVsActualReport />
          <CategoryBreakdownReport />
          <SpendingTrendReport />
          <AccountFlowReport />
          <YearInReviewReport />
          <PortfolioSummaryReport />
          <AssetAllocationReport />
          <DividendIncomeReport />
          <BestWorstPerformersReport />
          <NetWorthReport />
          <CashbookNetPositionReport />
          <AssetMaturityCalendarReport />
          <GoalProgressReport />
        </div>
      </ReportEmbedContext.Provider>
    </div>
  );
}
