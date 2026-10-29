'use client';

import {
  PieChart,
  FileText,
  UploadCloud,
  Activity,
  PiggyBank,
  ShieldCheck,
  CheckCircle2,
  Lock,
  BadgeCheck,
} from 'lucide-react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { FadeIn } from '@/components/landing/FadeIn';

const STATS = [
  { label: 'Asset classes', value: '14 Native', subtext: 'Equities to SGBs' },
  { label: 'Fiscal engine', value: 'FY 2024-25', subtext: 'Budget compliant' },
  { label: 'Ingestion speed', value: '1.4s', subtext: 'Client-side FIFO' },
  { label: 'Data policy', value: 'Zero sold', subtext: 'No telemetry, ever' },
];

const COMPARISON = [
  {
    criterion: 'Credential & ledger privacy',
    detail: 'Protection from data-aggregation leaks',
    kashmap: '100% client-side ingestion',
    sheets: 'Manual copy-paste, broken macros',
    aggregator: 'Third-party cloud storage & bank tokens',
  },
  {
    criterion: 'Budget 2024 tax accuracy',
    detail: 'LTCG 12.5% & STCG 20% splits by holding period',
    kashmap: 'Automated CA-ready schedules',
    sheets: 'Complex custom formulas required',
    aggregator: 'Generic unrealized summaries only',
  },
  {
    criterion: 'Alternative asset coverage',
    detail: 'EPF interest credits, SGB maturity, real estate',
    kashmap: 'Native 14-class ledger',
    sheets: 'Supported via manual formulas',
    aggregator: 'Equities & mutual funds only',
  },
  {
    criterion: 'Data monetization policy',
    detail: 'How your financial profile is used',
    kashmap: 'Zero ads, zero data sale',
    sheets: 'Private to your Google Drive',
    aggregator: 'Often monetized for loan/insurance ads',
  },
];

export default function FeaturesPage() {
  return (
    <div className="bg-background text-foreground min-h-full">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-12 text-center">
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border/80 text-xs font-medium text-muted-foreground mb-6 shadow-xs">
            <span className="size-2 rounded-full bg-success motion-safe:animate-pulse" />
            <span>Proprietary wealth intelligence, bank-grade architecture</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            Built to <span className="text-primary italic">master</span> your money.
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground mt-5 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            From bank imports to advanced tax reporting, KashMap replaces your spreadsheets with precision-engineered portfolio intelligence built for the Indian tax code.
          </p>

          {/* Metric Rail */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-12 p-4 sm:p-5 bg-card border border-border/80 rounded-2xl shadow-sm text-left">
            {STATS.map(({ label, value, subtext }) => (
              <div key={label} className="px-3 border-r last:border-r-0 border-border/50">
                <span className="text-xs font-medium text-muted-foreground block">{label}</span>
                <span className="font-serif text-2xl sm:text-3xl font-semibold text-foreground mt-1 block">
                  {value}
                </span>
                <span className="text-xs text-success font-medium flex items-center gap-1 mt-0.5">
                  <Lock className="size-3" />
                  {subtext}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid: 6 Core Capabilities */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-medium text-primary">Architecture and features</span>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground mt-1">
              Engineered for Indian capital structures.
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Zero credential sharing. Full local statement deduplication. Deep alignment with CBDT capital gains tax schedules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: 14 Asset Classes */}
          <FadeIn delay={0.05}>
            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <PieChart className="size-5" />
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  14 categories
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">14 Native Asset Classes</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Direct equity, mutual funds, SGBs, physical gold, real estate, EPF/PPF, NPS, US RSUs, and cash, each with automated valuation.
              </p>
            </div>
          </FadeIn>

          {/* Card 2: 16 Advanced Reports */}
          <FadeIn delay={0.1}>
            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="size-10 rounded-xl bg-success-subtle flex items-center justify-center text-success">
                  <FileText className="size-5" />
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success-subtle text-success">
                  CA-ready
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">16 Advanced Reports</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Pre-calculated capital gains (STCG &amp; LTCG per Budget 2024 rates), XIRR per asset class, dividend yield maps, and rebalancing diagnostics, ready for your ITR-2 / ITR-3 schedule.
              </p>
            </div>
          </FadeIn>

          {/* Card 3: Bank & Broker Ingestion */}
          <FadeIn delay={0.15}>
            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="size-10 rounded-xl bg-warning-subtle flex items-center justify-center text-warning">
                    <UploadCloud className="size-5" />
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-warning-subtle text-warning">
                    Client-side FIFO
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Bank &amp; broker ingestion</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Drop CAMS / KFintech Consolidated Account Statements (CAS), Zerodha Tradebook, or Groww CSVs. Instant local deduplication without sharing bank passwords.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 bg-muted/20 p-3 rounded-xl border border-border/40 space-y-2">
                <div className="flex items-center justify-between text-xs bg-background p-2 rounded-lg border border-border/50">
                  <div className="truncate">
                    <p className="font-medium text-foreground truncate">CAS_Consolidated_2024.pdf</p>
                    <p className="text-[10px] text-muted-foreground">28 folios, 1.4s parse</p>
                  </div>
                  <CheckCircle2 className="size-4 text-success shrink-0" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Zero passwords stored</span>
                  <span className="text-success font-semibold">100% in-browser</span>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Card 4: Financial Health Score */}
          <FadeIn delay={0.2}>
            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="size-10 rounded-xl bg-success-subtle flex items-center justify-center text-success">
                  <Activity className="size-5" />
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success-subtle text-success">
                  8 pillars
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Financial health score</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Continuous diagnostic analyzing emergency runway depth, debt-to-asset leverage, diversification concentration, and inflation-drag vulnerability.
              </p>
            </div>
          </FadeIn>

          {/* Card 5: Tax-Loss Harvesting */}
          <FadeIn delay={0.25}>
            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="size-10 rounded-xl bg-warning-subtle flex items-center justify-center text-warning">
                    <PiggyBank className="size-5" />
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-warning-subtle text-warning">
                    Sec 70 / 74
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Tax-loss harvesting</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Automated fiscal scan identifies unrealized short-term equity capital losses before March 31st to offset taxable capital gains under Indian income tax rules.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 bg-muted/20 p-3 rounded-xl border border-border/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">₹42,500 STCL available</span>
                  <span className="text-warning font-semibold">Under 20% bracket</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Net tax saving of <strong className="text-success">₹8,500</strong> for the fiscal year.
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Card 6: Privacy & Sovereign Storage */}
          <FadeIn delay={0.3}>
            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="size-5" />
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Zero-knowledge
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Sovereign data storage</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Your financial privacy is non-negotiable: zero telemetry, no Account Aggregator credential sharing, client-side AES-256 encryption isolated per user.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Comparison Matrix */}
      <section className="border-y border-border/60 bg-muted/20 py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-medium text-primary">Comparative analysis</span>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground mt-1.5">
              Why spreadsheets and account-aggregator apps fall short.
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              What disciplined Indian investors give up with a free tracker or a brittle spreadsheet.
            </p>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/70 text-xs font-medium text-muted-foreground bg-muted/40">
                    <th className="py-4 px-5 font-medium">Evaluation criteria</th>
                    <th className="py-4 px-5 font-semibold text-foreground bg-primary/10 border-x border-border/40">
                      <span className="flex items-center gap-1.5 text-primary">
                        <BadgeCheck className="size-4" />
                        KashMap
                      </span>
                    </th>
                    <th className="py-4 px-5 font-medium text-muted-foreground">Spreadsheets</th>
                    <th className="py-4 px-5 font-medium text-muted-foreground">Aggregator apps</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border/50">
                  {COMPARISON.map((row) => (
                    <tr key={row.criterion} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-medium text-foreground">{row.criterion}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{row.detail}</div>
                      </td>
                      <td className="py-4 px-5 bg-primary/5 border-x border-border/40 font-semibold text-primary">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="size-4 shrink-0" />
                          {row.kashmap}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-muted-foreground">{row.sheets}</td>
                      <td className="py-4 px-5 text-destructive font-medium">{row.aggregator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
