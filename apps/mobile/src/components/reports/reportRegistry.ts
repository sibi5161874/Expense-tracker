import {
  Scale,
  PieChart,
  ListTree,
  Calendar,
  TrendingUp,
  ArrowLeftRight,
  Award,
  Coins,
  Target,
  Users,
  CalendarClock,
  Wallet,
  BarChart3,
  Percent,
  ReceiptText,
  type LucideIcon,
} from "lucide-react-native";

export interface ReportLink {
  href:
    | "/(app)/monthly-summary-report"
    | "/(app)/budget-vs-actual-report"
    | "/(app)/category-breakdown-report"
    | "/(app)/spending-trend-report"
    | "/(app)/account-flow-report"
    | "/(app)/year-in-review-report"
    | "/(app)/portfolio"
    | "/(app)/asset-allocation-report"
    | "/(app)/dividend-income-report"
    | "/(app)/best-worst-performers-report"
    | "/(app)/capital-gains-report"
    | "/(app)/xirr-report"
    | "/(app)/net-worth-report"
    | "/(app)/cashbook-net-position-report"
    | "/(app)/asset-maturity-calendar-report"
    | "/(app)/goal-progress-report";
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface ReportSection {
  title: string;
  reports: ReportLink[];
}

/** All reports matching apps/web/src/components/reports/ 1:1. */
export const REPORT_SECTIONS: ReportSection[] = [
  {
    title: "Cash Flow",
    reports: [
      { href: "/(app)/monthly-summary-report", icon: Wallet, title: "Monthly Summary", description: "Income, expense, and savings this month." },
      { href: "/(app)/budget-vs-actual-report", icon: BarChart3, title: "Budget vs Actual", description: "Spend against your monthly limit." },
      { href: "/(app)/category-breakdown-report", icon: ListTree, title: "Category Breakdown", description: "Where your money went this month." },
      { href: "/(app)/spending-trend-report", icon: TrendingUp, title: "Spending Trend", description: "Top expense categories over 6 months." },
      { href: "/(app)/account-flow-report", icon: ArrowLeftRight, title: "Account-wise Flow", description: "Money in vs out per account." },
      { href: "/(app)/year-in-review-report", icon: Calendar, title: "Year in Review", description: "This year's totals, biggest month, top category." },
    ],
  },
  {
    title: "Investments",
    reports: [
      { href: "/(app)/portfolio", icon: PieChart, title: "Portfolio Summary", description: "Current value, invested amount, and P&L per holding." },
      { href: "/(app)/asset-allocation-report", icon: Coins, title: "Asset Allocation", description: "Portfolio split by asset type and holding." },
      { href: "/(app)/dividend-income-report", icon: Wallet, title: "Dividend Income", description: "Total dividends received." },
      { href: "/(app)/best-worst-performers-report", icon: Award, title: "Best/Worst Performers", description: "Holdings ranked by return %." },
      { href: "/(app)/capital-gains-report", icon: ReceiptText, title: "Capital Gains (STCG/LTCG)", description: "Realized gains & tax-season breakdown by FY." },
      { href: "/(app)/xirr-report", icon: Percent, title: "XIRR Return Analysis", description: "Annualized internal rate of return." },
    ],
  },
  {
    title: "Net Worth & Obligations",
    reports: [
      { href: "/(app)/net-worth-report", icon: Scale, title: "Net Worth Statement", description: "Assets, portfolio, and liabilities snapshot." },
      { href: "/(app)/cashbook-net-position-report", icon: Users, title: "Cashbook Net Position", description: "Who owes you, who you owe." },
      { href: "/(app)/asset-maturity-calendar-report", icon: CalendarClock, title: "Asset Maturity Calendar", description: "FDs, premiums, and loans by date." },
      { href: "/(app)/goal-progress-report", icon: Target, title: "Goal Progress", description: "Saved vs target for every goal." },
    ],
  },
];

