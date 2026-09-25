'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { getReportMeta } from '@/lib/reportsRegistry';
import { LoadingState } from '@/components/shared/QueryState';

const REPORT_COMPONENTS: Record<string, ReturnType<typeof dynamic>> = {
  'monthly-summary': dynamic(() => import('@/components/reports/MonthlySummaryReport').then((m) => m.MonthlySummaryReport), {
    loading: () => <LoadingState label="Loading report..." />,
  }),
  'budget-vs-actual': dynamic(() => import('@/components/reports/BudgetVsActualReport').then((m) => m.BudgetVsActualReport), {
    loading: () => <LoadingState label="Loading report..." />,
  }),
  'category-breakdown': dynamic(() => import('@/components/reports/CategoryBreakdownReport').then((m) => m.CategoryBreakdownReport), {
    loading: () => <LoadingState label="Loading report..." />,
  }),
  'spending-trend': dynamic(() => import('@/components/reports/SpendingTrendReport').then((m) => m.SpendingTrendReport), {
    loading: () => <LoadingState label="Loading report..." />,
  }),
  'account-flow': dynamic(() => import('@/components/reports/AccountFlowReport').then((m) => m.AccountFlowReport), {
    loading: () => <LoadingState label="Loading report..." />,
  }),
  'year-in-review': dynamic(() => import('@/components/reports/YearInReviewReport').then((m) => m.YearInReviewReport), {
    loading: () => <LoadingState label="Loading report..." />,
  }),
  'portfolio-summary': dynamic(() => import('@/components/reports/PortfolioSummaryReport').then((m) => m.PortfolioSummaryReport), {
    loading: () => <LoadingState label="Loading report..." />,
  }),
  'asset-allocation': dynamic(() => import('@/components/reports/AssetAllocationReport').then((m) => m.AssetAllocationReport), {
    loading: () => <LoadingState label="Loading report..." />,
  }),
  'dividend-income': dynamic(() => import('@/components/reports/DividendIncomeReport').then((m) => m.DividendIncomeReport), {
    loading: () => <LoadingState label="Loading report..." />,
  }),
  'best-worst-performers': dynamic(() => import('@/components/reports/BestWorstPerformersReport').then((m) => m.BestWorstPerformersReport), {
    loading: () => <LoadingState label="Loading report..." />,
  }),
  'capital-gains': dynamic(() => import('@/components/reports/CapitalGainsReport').then((m) => m.CapitalGainsReport), {
    loading: () => <LoadingState label="Loading report..." />,
  }),
  'xirr-analysis': dynamic(() => import('@/components/reports/XirrReport').then((m) => m.XirrReport), {
    loading: () => <LoadingState label="Loading report..." />,
  }),
  'net-worth': dynamic(() => import('@/components/reports/NetWorthReport').then((m) => m.NetWorthReport), {
    loading: () => <LoadingState label="Loading report..." />,
  }),

  'cashbook-net-position': dynamic(() => import('@/components/reports/CashbookNetPositionReport').then((m) => m.CashbookNetPositionReport), {
    loading: () => <LoadingState label="Loading report..." />,
  }),
  'asset-maturity-calendar': dynamic(() => import('@/components/reports/AssetMaturityCalendarReport').then((m) => m.AssetMaturityCalendarReport), {
    loading: () => <LoadingState label="Loading report..." />,
  }),
  'goal-progress': dynamic(() => import('@/components/reports/GoalProgressReport').then((m) => m.GoalProgressReport), {
    loading: () => <LoadingState label="Loading report..." />,
  }),
};

export default function ReportPage({ params }: { params: Promise<{ reportSlug: string }> }) {
  const { reportSlug } = use(params);
  const meta = getReportMeta(reportSlug);
  const ReportComponent = REPORT_COMPONENTS[reportSlug];

  if (!meta || !ReportComponent) {
    notFound();
  }

  return <ReportComponent />;
}
