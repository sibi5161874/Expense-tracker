export interface OnboardingSlide {
  id: string;
  badge: string;
  title: string;
  description: string;
  iconName: string;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "net-worth",
    badge: "360° WEALTH",
    title: "Master Your Total Net Worth",
    description:
      "Track your complete financial universe in one private dashboard: bank accounts, Indian equities, mutual funds, fixed deposits, physical gold, and liabilities.",
    iconName: "TrendingUp",
  },
  {
    id: "portfolio",
    badge: "INTELLIGENT INSIGHTS",
    title: "Portfolio & Dividend Tracking",
    description:
      "Monitor sector heatmaps, auto-refresh live market prices, track real dividend yields, calculate XIRR, and harvest tax losses before year-end.",
    iconName: "PieChart",
  },
  {
    id: "privacy",
    badge: "100% PRIVATE",
    title: "Privacy-First Financial Haven",
    description:
      "Your financial records belong exclusively to you. Enforced with Postgres Row-Level Security, end-to-end encryption, and zero third-party data selling.",
    iconName: "ShieldCheck",
  },
  {
    id: "quick-add",
    badge: "EFFORTLESS LOGGING",
    title: "Quick-Add & Bank Import",
    description:
      "Log transactions in seconds using Natural Language AI, automated recurring rules, or by dropping bank & broker statement CSVs with smart auto-mapping.",
    iconName: "Sparkles",
  },
];
