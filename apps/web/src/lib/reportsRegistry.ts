export interface ReportMeta {
  slug: string;
  title: string;
  description: string;
  category: 'Expense' | 'Investment' | 'Combined';
}

export const REPORTS: ReportMeta[] = [
  // Expense reports
  {
    slug: 'monthly-summary',
    title: 'Monthly Summary',
    description: 'Income, expense, savings, and savings rate for the current month.',
    category: 'Expense',
  },
  {
    slug: 'budget-vs-actual',
    title: 'Budget vs Actual',
    description: 'Spend against your monthly limit, per category.',
    category: 'Expense',
  },
  {
    slug: 'category-breakdown',
    title: 'Category Breakdown',
    description: 'Where your money goes this month, by category.',
    category: 'Expense',
  },
  {
    slug: 'spending-trend',
    title: 'Spending Trend',
    description: 'Category spend over the last 6 months.',
    category: 'Expense',
  },
  {
    slug: 'account-flow',
    title: 'Account-wise Flow',
    description: 'Net movement per account over the last 3 months.',
    category: 'Expense',
  },
  {
    slug: 'year-in-review',
    title: 'Year in Review',
    description: 'Annual totals, biggest month, and top category.',
    category: 'Expense',
  },
  // Investment reports
  {
    slug: 'portfolio-summary',
    title: 'Portfolio Summary',
    description: 'Current value, invested amount, and P&L per holding.',
    category: 'Investment',
  },
  {
    slug: 'asset-allocation',
    title: 'Asset Allocation',
    description: 'Portfolio split by asset type and by individual holding.',
    category: 'Investment',
  },
  {
    slug: 'dividend-income',
    title: 'Dividend Income',
    description: 'Dividends received, by holding and by month.',
    category: 'Investment',
  },
  {
    slug: 'best-worst-performers',
    title: 'Best/Worst Performing Holdings',
    description: 'Holdings ranked by unrealised return %.',
    category: 'Investment',
  },
  {
    slug: 'capital-gains',
    title: 'Capital Gains (STCG/LTCG)',
    description: 'Realized profit/loss, FIFO lot matching, and tax-season breakdown by FY.',
    category: 'Investment',
  },
  {
    slug: 'xirr-analysis',
    title: 'XIRR Return Analysis',
    description: 'Extended Internal Rate of Return across irregular cash flows and live portfolio value.',
    category: 'Investment',
  },

  // Combined / net worth reports
  {
    slug: 'net-worth',
    title: 'Net Worth Statement',
    description: 'Assets, portfolio, and liabilities — current snapshot.',
    category: 'Combined',
  },
  {
    slug: 'cashbook-net-position',
    title: 'Cashbook Net Position',
    description: 'Who owes you, who you owe, and what is overdue.',
    category: 'Combined',
  },
  {
    slug: 'asset-maturity-calendar',
    title: 'Asset Maturity Calendar',
    description: 'Fixed deposits sorted by maturity date, plus open liabilities.',
    category: 'Combined',
  },
  {
    slug: 'goal-progress',
    title: 'Goal Progress',
    description: 'Saved vs target for every goal.',
    category: 'Combined',
  },
];

export function getReportMeta(slug: string): ReportMeta | undefined {
  return REPORTS.find((r) => r.slug === slug);
}
