import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronRight, Download, Lock } from "lucide-react-native";
import { useMonthlyOverview } from "@/hooks/useTransactions";
import { useBudgetLimits } from "@/hooks/useBudgetLimits";
import { useTransactionsInRange, monthsAgo, yearRange } from "@/hooks/useReportsData";
import { useAllInvestmentLog } from "@/hooks/useInvestmentLog";
import { useHoldings } from "@/hooks/useHoldings";
import { useNetWorth } from "@/hooks/useNetWorth";
import { useCashbook } from "@/hooks/useCashbook";
import { useFixedDeposits, useLoanLiabilities } from "@/hooks/useAssets";
import { useInsurancePolicies } from "@/hooks/useInsurancePolicies";
import { useGoals } from "@/hooks/useGoals";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  calculateBudgetStatus,
  groupInvestmentsBySymbol,
  summarizeHoldings,
  calculateProgressPct,
  calculateGoalStatus,
  calculateDaysLeft,
  calculateFixedDepositStatus,
  calculatePremiumStatus,
  calculateDaysUntilDue,
} from "@repo/shared/logic";
import { formatMonth } from "@repo/shared/utils";
import { formatINR } from "@repo/shared/utils/currency";
import { exportReportToPdf } from "@/lib/exportToPdf";
import type { ExcelSheet } from "@/lib/exportToExcel";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { Button } from "@/components/common/Button";
import { useThemeColor } from "@/lib/colors";
import type { ReportLink } from "@/components/reports/reportRegistry";

const SPENDING_TREND_MONTHS = 6;
const ACCOUNT_FLOW_MONTHS = 3;

/**
 * Every report combined into one PDF — mirrors apps/web's /reports/overall, but built
 * differently: web renders 14 separate <XReport/> components that each register their own
 * sheets into a shared ref via ReportEmbedContext as their data resolves async. Mobile's
 * report screens aren't separate embeddable components (each is a full-screen route with
 * its own layout), so there's nothing to embed — this screen instead calls the same hooks
 * and recomputes the same sheet-building logic each individual report screen already has,
 * once, directly. Same combined PDF, no registry needed since everything resolves in one
 * component's render instead of across 14 mounted children.
 *
 * On-screen this shows a compact one-line summary per report (not each report's full
 * charts — duplicating 13 screens' worth of chart UI into one screen would be a lot of
 * layout for little benefit over just opening that report directly, which each row links
 * to). The PDF is the actual "everything, in full" artifact, matching the web page's own
 * "PDF-only, no Excel" scope decision (combining 14 tabular sheets into one spreadsheet
 * isn't meaningful either).
 */
export default function OverallReportScreen() {
  const { hasFeature } = useEntitlements();
  const canExport = hasFeature("reportExport");
  const [isExporting, setIsExporting] = useState(false);
  const primary = useThemeColor("primary");
  const mutedForeground = useThemeColor("mutedForeground");

  const currentMonth = formatMonth(new Date());
  const { data: budgetLimits, isLoading: budgetsLoading } = useBudgetLimits();
  const { income, expense, netSavings, savingsRate, categoryBreakdown, isLoading: overviewLoading } =
    useMonthlyOverview(currentMonth);

  const spendingTrendFrom = monthsAgo(SPENDING_TREND_MONTHS - 1);
  const rangeTo = formatMonth(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)) + "-01";
  const { data: spendingTrendTxns, isLoading: spendingTrendLoading } = useTransactionsInRange(spendingTrendFrom, rangeTo);
  const accountFlowFrom = monthsAgo(ACCOUNT_FLOW_MONTHS - 1);
  const { data: accountFlowTxns, isLoading: accountFlowLoading } = useTransactionsInRange(accountFlowFrom, rangeTo);
  const currentYear = new Date().getFullYear();
  const { from: yearFrom, to: yearTo } = yearRange(currentYear);
  const { data: yearTxns, isLoading: yearLoading } = useTransactionsInRange(yearFrom, yearTo);

  const { data: allInvestments, isLoading: investmentsLoading } = useAllInvestmentLog();
  const { data: holdingRows, isLoading: holdingsLoading } = useHoldings();
  const { data: netWorth, isLoading: netWorthLoading } = useNetWorth();
  const { summary: cashbookSummary, isLoading: cashbookLoading } = useCashbook();
  const { data: fds, isLoading: fdsLoading } = useFixedDeposits();
  const { data: liabilities, isLoading: liabilitiesLoading } = useLoanLiabilities();
  const { data: policies, isLoading: policiesLoading } = useInsurancePolicies();
  const { data: goals, isLoading: goalsLoading } = useGoals();

  const isLoading =
    budgetsLoading ||
    overviewLoading ||
    spendingTrendLoading ||
    accountFlowLoading ||
    yearLoading ||
    investmentsLoading ||
    holdingsLoading ||
    netWorthLoading ||
    cashbookLoading ||
    fdsLoading ||
    liabilitiesLoading ||
    policiesLoading ||
    goalsLoading;

  const budgetRows = useMemo(() => {
    if (!budgetLimits) return [];
    return budgetLimits.map((limit) => {
      const actual = categoryBreakdown.find((c) => c.name === limit.category?.name)?.value ?? 0;
      return {
        category: limit.category?.name ?? "Unknown",
        limit: limit.monthly_limit,
        actual,
        status: calculateBudgetStatus(actual, limit.monthly_limit),
      };
    });
  }, [budgetLimits, categoryBreakdown]);

  const spendingTrendRows = useMemo(() => {
    const expenses = (spendingTrendTxns ?? []).filter((t) => t.type === "Expense");
    const months: string[] = [];
    for (let i = SPENDING_TREND_MONTHS - 1; i >= 0; i--) {
      const d = new Date();
      months.push(formatMonth(new Date(d.getFullYear(), d.getMonth() - i, 1)));
    }
    return months.flatMap((month) => {
      const totals = new Map<string, number>();
      for (const t of expenses) {
        if (!t.date.startsWith(month)) continue;
        const name = t.category?.name ?? "Uncategorized";
        totals.set(name, (totals.get(name) ?? 0) + t.amount);
      }
      return Array.from(totals, ([name, value]) => ({ month, name, value }));
    });
  }, [spendingTrendTxns]);

  const accountFlowRows = useMemo(() => {
    const byAccount = new Map<string, { name: string; in: number; out: number }>();
    const ensure = (id: string, name: string) => {
      if (!byAccount.has(id)) byAccount.set(id, { name, in: 0, out: 0 });
      return byAccount.get(id)!;
    };
    for (const t of accountFlowTxns ?? []) {
      if (t.type === "Income") {
        ensure(t.from_account_id, t.from_account?.name ?? "Unknown").in += t.amount;
      } else if (t.type === "Expense") {
        ensure(t.from_account_id, t.from_account?.name ?? "Unknown").out += t.amount;
      } else {
        ensure(t.from_account_id, t.from_account?.name ?? "Unknown").out += t.amount;
        if (t.to_account_id) ensure(t.to_account_id, t.to_account?.name ?? "Unknown").in += t.amount;
      }
    }
    return Array.from(byAccount.values()).map((a) => ({ ...a, net: a.in - a.out }));
  }, [accountFlowTxns]);

  const yearInReview = useMemo(() => {
    const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthly = MONTH_LABELS.map((label, i) => ({ label, monthIndex: i, income: 0, expense: 0 }));
    let totalIncome = 0;
    let totalExpense = 0;
    for (const t of yearTxns ?? []) {
      const monthIndex = Number(t.date.slice(5, 7)) - 1;
      const bucket = monthly[monthIndex];
      if (!bucket) continue;
      if (t.type === "Income") {
        bucket.income += t.amount;
        totalIncome += t.amount;
      } else if (t.type === "Expense") {
        bucket.expense += t.amount;
        totalExpense += t.amount;
      }
    }
    return { monthly, totalIncome, totalExpense };
  }, [yearTxns]);

  const livePriceOverrides = useMemo(
    () => Object.fromEntries((holdingRows ?? []).map((h) => [h.symbol, h.live_price])),
    [holdingRows]
  );
  const holdings = useMemo(
    () => (allInvestments ? groupInvestmentsBySymbol(allInvestments, livePriceOverrides) : []),
    [allInvestments, livePriceOverrides]
  );
  const portfolioSummary = allInvestments ? summarizeHoldings(holdings) : null;

  const byAssetType = useMemo(() => {
    const totals = new Map<string, number>();
    for (const h of holdings) totals.set(h.assetType, (totals.get(h.assetType) ?? 0) + h.currentValue);
    return Array.from(totals, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [holdings]);

  const dividends = useMemo(() => {
    const rows = (allInvestments ?? []).filter((i) => i.action === "DIVIDEND");
    const holdingTotals = new Map<string, number>();
    for (const d of rows) holdingTotals.set(d.symbol, (holdingTotals.get(d.symbol) ?? 0) + d.price);
    return {
      total: rows.reduce((sum, d) => sum + d.price, 0),
      byHolding: Array.from(holdingTotals, ([symbol, amount]) => ({ symbol, amount })).sort((a, b) => b.amount - a.amount),
    };
  }, [allInvestments]);

  const performers = useMemo(
    () => [...holdings].sort((a, b) => b.returnPct - a.returnPct).map((h) => ({ symbol: h.symbol, returnPct: Number((h.returnPct * 100).toFixed(2)) })),
    [holdings]
  );

  const netWorthRows = netWorth
    ? [
        { name: "Cash & Bank", value: netWorth.cashAndBankTotal },
        { name: "Fixed Deposits", value: netWorth.fixedDepositsTotal },
        { name: "Gold", value: netWorth.goldTotal },
        { name: "EPF", value: netWorth.epfTotal },
        { name: "NPS", value: netWorth.npsTotal },
        { name: "SSY", value: netWorth.ssyTotal },
        { name: "SGB", value: netWorth.sgbTotal },
        { name: "ULIP", value: netWorth.ulipTotal },
        { name: "Real Estate", value: netWorth.realEstateTotal },
        { name: "PPF", value: netWorth.ppfTotal },
        { name: "Recurring Deposits", value: netWorth.recurringDepositsTotal },
        { name: "NSC", value: netWorth.nscTotal },
        { name: "Vehicles", value: netWorth.vehiclesTotal },
        { name: "Portfolio", value: netWorth.portfolioValue },
      ].filter((r) => r.value > 0)
    : [];

  const cashbookRows = cashbookSummary ? Object.entries(cashbookSummary) : [];

  const sortedFds = useMemo(
    () => (fds ? [...fds].filter((fd) => !fd.withdrawn).sort((a, b) => a.maturity_date.localeCompare(b.maturity_date)) : []),
    [fds]
  );
  const sortedPolicies = useMemo(
    () => (policies ? [...policies].sort((a, b) => a.premium_due_date.localeCompare(b.premium_due_date)) : []),
    [policies]
  );

  interface Section {
    title: string;
    stat: string;
    count: number;
    href: ReportLink["href"];
    sheets: ExcelSheet[];
  }

  const sections: Section[] = [
    {
      title: "Monthly Summary",
      stat: `${formatINR(netSavings)} net savings`,
      count: 4,
      href: "/(app)/monthly-summary-report",
      sheets: [
        {
          name: "Monthly Summary",
          rows: [
            { Item: "Income", Amount: income },
            { Item: "Expense", Amount: expense },
            { Item: "Net Savings", Amount: netSavings },
            { Item: "Savings Rate", Amount: `${savingsRate.toFixed(1)}%` },
          ],
        },
      ],
    },
    {
      title: "Budget vs Actual",
      stat: `${budgetRows.length} budget${budgetRows.length === 1 ? "" : "s"} tracked`,
      count: budgetRows.length,
      href: "/(app)/budget-vs-actual-report",
      sheets: [
        { name: "Budget vs Actual", rows: budgetRows.map((r) => ({ Category: r.category, Budget: r.limit, Actual: r.actual, Status: r.status })) },
      ],
    },
    {
      title: "Category Breakdown",
      stat: `${categoryBreakdown.length} categor${categoryBreakdown.length === 1 ? "y" : "ies"} this month`,
      count: categoryBreakdown.length,
      href: "/(app)/category-breakdown-report",
      sheets: [
        {
          name: "Category Breakdown",
          rows: categoryBreakdown.map((c) => ({
            Category: c.name,
            Amount: c.value,
            "% of Total": expense > 0 ? `${((c.value / expense) * 100).toFixed(1)}%` : "-",
          })),
        },
      ],
    },
    {
      title: "Spending Trend",
      stat: `Last ${SPENDING_TREND_MONTHS} months`,
      count: spendingTrendRows.length,
      href: "/(app)/spending-trend-report",
      sheets: [{ name: "Spending Trend", rows: spendingTrendRows.map((r) => ({ Month: r.month, Category: r.name, Amount: r.value })) }],
    },
    {
      title: "Account-wise Flow",
      stat: `${accountFlowRows.length} account${accountFlowRows.length === 1 ? "" : "s"}`,
      count: accountFlowRows.length,
      href: "/(app)/account-flow-report",
      sheets: [{ name: "Account Flow", rows: accountFlowRows.map((r) => ({ Account: r.name, In: r.in, Out: r.out, Net: r.net })) }],
    },
    {
      title: "Year in Review",
      stat: `${formatINR(yearInReview.totalIncome - yearInReview.totalExpense)} net, ${currentYear}`,
      count: 12,
      href: "/(app)/year-in-review-report",
      sheets: [{ name: "Year in Review", rows: yearInReview.monthly.map((m) => ({ Month: m.label, Income: m.income, Expense: m.expense })) }],
    },
    {
      title: "Portfolio Summary",
      stat: portfolioSummary ? `${formatINR(portfolioSummary.currentValue)} current value` : "No holdings",
      count: holdings.length,
      href: "/(app)/portfolio",
      sheets: [
        {
          name: "Portfolio Summary",
          rows: holdings.map((h) => ({
            Symbol: h.symbol,
            "Units Held": h.unitsHeld,
            "Avg Buy Price": h.avgBuyPrice,
            "Current Value": h.currentValue,
            Invested: h.invested,
            "Unrealised P&L": h.unrealisedPnl,
            "Return %": Number((h.returnPct * 100).toFixed(2)),
          })),
        },
      ],
    },
    {
      title: "Asset Allocation",
      stat: `${byAssetType.length} asset type${byAssetType.length === 1 ? "" : "s"}`,
      count: byAssetType.length,
      href: "/(app)/asset-allocation-report",
      sheets: [
        { name: "By Asset Type", rows: byAssetType.map((a) => ({ "Asset Type": a.name, Value: a.value })) },
        { name: "By Holding", rows: holdings.map((h) => ({ Holding: h.symbol, Value: h.currentValue })) },
      ],
    },
    {
      title: "Dividend Income",
      stat: `${formatINR(dividends.total)} total`,
      count: dividends.byHolding.length,
      href: "/(app)/dividend-income-report",
      sheets: [{ name: "Dividend Income", rows: dividends.byHolding.map((h) => ({ Symbol: h.symbol, Total: h.amount })) }],
    },
    {
      title: "Best/Worst Performers",
      stat: `${performers.length} holding${performers.length === 1 ? "" : "s"} ranked`,
      count: performers.length,
      href: "/(app)/best-worst-performers-report",
      sheets: [{ name: "Best-Worst Performers", rows: performers.map((h) => ({ Symbol: h.symbol, "Return %": h.returnPct })) }],
    },
    {
      title: "Net Worth Statement",
      stat: netWorth ? `${formatINR(netWorth.netWorth)} net worth` : "-",
      count: netWorthRows.length,
      href: "/(app)/net-worth-report",
      sheets: [
        {
          name: "Net Worth",
          rows: netWorth
            ? [
                ...netWorthRows.map((r) => ({ Item: r.name, Amount: r.value })),
                { Item: "Liabilities", Amount: -netWorth.liabilitiesTotal },
                { Item: "Net Worth", Amount: netWorth.netWorth },
              ]
            : [],
        },
      ],
    },
    {
      title: "Cashbook Net Position",
      stat: `${cashbookRows.length} counterpart${cashbookRows.length === 1 ? "y" : "ies"}`,
      count: cashbookRows.length,
      href: "/(app)/cashbook-net-position-report",
      sheets: [
        {
          name: "Cashbook Net Position",
          rows: cashbookRows.map(([counterparty, item]) => ({
            Counterparty: counterparty,
            Given: item.totalGiven,
            Received: item.totalReceived,
            Net: item.netBalance,
            Overdue: item.hasOverdue ? "Yes" : "No",
          })),
        },
      ],
    },
    {
      title: "Asset Maturity Calendar",
      stat: `${sortedFds.length} FD${sortedFds.length === 1 ? "" : "s"}, ${sortedPolicies.length} polic${sortedPolicies.length === 1 ? "y" : "ies"}`,
      count: sortedFds.length + sortedPolicies.length + (liabilities?.length ?? 0),
      href: "/(app)/asset-maturity-calendar-report",
      sheets: [
        { name: "FD Maturities", rows: sortedFds.map((fd) => ({ Bank: fd.bank, "Maturity Date": fd.maturity_date, Value: fd.maturity_value })) },
        { name: "Insurance Premiums", rows: sortedPolicies.map((p) => ({ Insurer: p.insurer, "Due Date": p.premium_due_date, Premium: p.premium_amount })) },
        {
          name: "Open Liabilities",
          rows: (liabilities ?? []).map((l) => ({ Lender: l.lender, Outstanding: l.outstanding, "Months Left": l.months_left ?? "-" })),
        },
      ],
    },
    {
      title: "Goal Progress",
      stat: `${goals?.length ?? 0} goal${(goals?.length ?? 0) === 1 ? "" : "s"}`,
      count: goals?.length ?? 0,
      href: "/(app)/goal-progress-report",
      sheets: [
        {
          name: "Goal Progress",
          rows: (goals ?? []).map((g) => ({
            Goal: g.goal_name,
            Saved: g.saved_amount,
            Target: g.target_amount,
            Status: calculateGoalStatus(g.saved_amount, g.target_amount, g.target_date),
          })),
        },
      ],
    },
  ];

  async function handleExport() {
    if (!canExport) {
      Alert.alert("Pro feature", "Exporting reports is a Pro feature.", [
        { text: "Not now", style: "cancel" },
        { text: "View plans", onPress: () => router.push("/(app)/billing") },
      ]);
      return;
    }
    const collected = sections.flatMap((s) =>
      s.sheets
        .filter((sheet) => sheet.rows.length > 0)
        .map((sheet) => ({ ...sheet, name: s.sheets.length > 1 ? `${s.title} — ${sheet.name}` : s.title }))
    );
    if (collected.length === 0) {
      Alert.alert("Nothing to export yet", "Add some transactions or assets first.");
      return;
    }
    setIsExporting(true);
    try {
      await exportReportToPdf("Overall Report", "Every report combined into one document.", collected, "overall-report");
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Couldn't export PDF.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-3 p-4 pb-32">
        <PageHeader
          title="Overall Report"
          description="Every report combined into one document."
          action={
            <Button onPress={handleExport} disabled={isExporting}>
              {canExport ? <Download size={16} color="white" /> : <Lock size={16} color="white" />}
              <AppText className="text-sm font-medium text-primary-foreground">{isExporting ? "Exporting…" : "PDF"}</AppText>
            </Button>
          }
        />

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : (
          sections.map((s) => (
            <Pressable
              key={s.title}
              onPress={() => router.push(s.href)}
              className="flex-row items-center gap-3 rounded-2xl bg-card p-4 active:opacity-70"
            >
              <View className="flex-1">
                <AppText className="text-sm font-medium">{s.title}</AppText>
                <AppText className="text-xs text-muted-foreground">{s.stat}</AppText>
              </View>
              <ChevronRight size={18} color={mutedForeground} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
