'use client';

import { useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { ReportEmbedContext } from '@/components/shared/ReportContainer';
import { exportToPdf } from '@/lib/exportToPdf';
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

export default function OverallReportPage() {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      await exportToPdf(printRef.current, 'overall-report');
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
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="size-4" />
            {isExporting ? 'Exporting...' : 'Download PDF'}
          </Button>
        }
      />

      <ReportEmbedContext.Provider value={true}>
        <div ref={printRef} className="bg-background space-y-10 p-1">
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
