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
    | "/monthly-summary-report"
    | "/budget-vs-actual-report"
    | "/category-breakdown-report"
    | "/spending-trend-report"
    | "/account-flow-report"
    | "/year-in-review-report"
    | "/portfolio"
    | "/asset-allocation-report"
    | "/dividend-income-report"
    | "/best-worst-performers-report"
    | "/capital-gains-report"
    | "/xirr-report"
    | "/net-worth-report"
    | "/cashbook-net-position-report"
    | "/asset-maturity-calendar-report"
    | "/goal-progress-report";
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
      { href: "/monthly-summary-report", icon: Wallet, title: "Monthly Summary", description: "Income, expense, and savings this month." },
      { href: "/budget-vs-actual-report", icon: BarChart3, title: "Budget vs Actual", description: "Spend against your monthly limit." },
      { href: "/category-breakdown-report", icon: ListTree, title: "Category Breakdown", description: "Where your money went this month." },
      { href: "/spending-trend-report", icon: TrendingUp, title: "Spending Trend", description: "Top expense categories over 6 months." },
      { href: "/account-flow-report", icon: ArrowLeftRight, title: "Account-wise Flow", description: "Money in vs out per account." },
      { href: "/year-in-review-report", icon: Calendar, title: "Year in Review", description: "This year's totals, biggest month, top category." },
    ],
  },
  {
    title: "Investments",
    reports: [
      { href: "/portfolio", icon: PieChart, title: "Portfolio Summary", description: "Current value, invested amount, and P&L per holding." },
      { href: "/asset-allocation-report", icon: Coins, title: "Asset Allocation", description: "Portfolio split by asset type and holding." },
      { href: "/dividend-income-report", icon: Wallet, title: "Dividend Income", description: "Total dividends received." },
      { href: "/best-worst-performers-report", icon: Award, title: "Best/Worst Performers", description: "Holdings ranked by return %." },
      { href: "/capital-gains-report", icon: ReceiptText, title: "Capital Gains (STCG/LTCG)", description: "Realized gains & tax-season breakdown by FY." },
      { href: "/xirr-report", icon: Percent, title: "XIRR Return Analysis", description: "Annualized internal rate of return." },
    ],
  },
  {
    title: "Net Worth & Obligations",
    reports: [
      { href: "/net-worth-report", icon: Scale, title: "Net Worth Statement", description: "Assets, portfolio, and liabilities snapshot." },
      { href: "/cashbook-net-position-report", icon: Users, title: "Cashbook Net Position", description: "Who owes you, who you owe." },
      { href: "/asset-maturity-calendar-report", icon: CalendarClock, title: "Asset Maturity Calendar", description: "FDs, premiums, and loans by date." },
      { href: "/goal-progress-report", icon: Target, title: "Goal Progress", description: "Saved vs target for every goal." },
    ],
  },
];

