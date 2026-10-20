'use client';

import Link from 'next/link';
import {
  ArrowRight,
  PieChart,
  FileText,
  UploadCloud,
  Activity,
  PiggyBank,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { FadeIn } from '@/components/landing/FadeIn';

const STATS = [
  { label: 'AUM Tracked', value: '₹1,840+ Cr', subtext: 'Zero telemetry' },
  { label: 'Asset Classes', value: '14 Native', subtext: 'Equities to SGBs' },
  { label: 'Fiscal Engine', value: 'FY 2024-25', subtext: 'Budget compliant' },
  { label: 'Ingestion Speed', value: '1.4s', subtext: 'Client-side FIFO' },
];

export default function FeaturesPage() {
  return (
    <div className="bg-background text-foreground min-h-full">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-12 text-center">
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border/80 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6 shadow-xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Proprietary Wealth Intelligence • Bank-Grade Architecture</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            Everything you need to <span className="text-primary italic">master</span> your money.
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground mt-5 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            From bank imports to advanced tax reporting, KashMap replaces your spreadsheets with precision-engineered portfolio intelligence built for the Indian tax code.
          </p>

          {/* Metric Rail */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-12 p-4 sm:p-5 bg-card border border-border/80 rounded-2xl shadow-sm text-left">
            {STATS.map(({ label, value, subtext }) => (
              <div key={label} className="px-3 border-r last:border-r-0 border-border/50">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  {label}
                </span>
                <span className="font-serif text-2xl sm:text-3xl font-semibold text-foreground mt-1 block">
                  {value}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
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
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Architecture &amp; Features
            </span>
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
            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <PieChart className="size-5" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    14 Categories
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">14 Native Asset Classes</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Comprehensive coverage for modern Indian portfolios: Direct Equity, Mutual Funds, SGBs, Physical Gold, Real Estate, EPF/PPF, NPS, US RSUs, and Cash.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 bg-muted/20 p-3 rounded-xl border border-border/40">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Direct Equity',
                    'Mutual Funds',
                    'SGB / Gold',
                    'EPF & PPF',
                    'Real Estate',
                    'US Equities',
                    'NPS Tier I',
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-background text-[11px] font-medium text-foreground border border-border/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Card 2: 16 Advanced Reports */}
          <FadeIn delay={0.1}>
            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <FileText className="size-5" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    CA-Ready
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">16 Advanced Reports</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Pre-calculated Capital Gains (STCG &amp; LTCG as per Budget 2024 revised rates), XIRR per asset class, dividend yield maps, and asset rebalancing diagnostics.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 bg-muted/20 p-3 rounded-xl border border-border/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">ITR-2 / ITR-3 Schedule</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px]">AY 2025-26</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-background p-2 rounded-lg border border-border/50">
                  <div>
                    <span className="text-[10px] font-sans text-muted-foreground block">LTCG (12.5%)</span>
                    <span className="font-semibold text-foreground">₹4,12,850</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans text-muted-foreground block">STCG (20%)</span>
                    <span className="font-semibold text-foreground">₹86,400</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Card 3: Bank & Broker Ingestion */}
          <FadeIn delay={0.15}>
            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <UploadCloud className="size-5" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    Client-Side FIFO
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Bank &amp; Broker Ingestion</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Drop CAMS / KFintech Consolidated Account Statements (CAS), Zerodha Tradebook, or Groww CSVs. Instant local deduplication without sharing bank passwords.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 bg-muted/20 p-3 rounded-xl border border-border/40 space-y-2">
                <div className="flex items-center justify-between text-xs bg-background p-2 rounded-lg border border-border/50">
                  <div className="truncate">
                    <p className="font-medium text-foreground truncate">CAS_Consolidated_2024.pdf</p>
                    <p className="text-[10px] text-muted-foreground">28 Folios • 1.4s parse</p>
                  </div>
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Zero passwords stored</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% In-Browser</span>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Card 4: Financial Health Score */}
          <FadeIn delay={0.2}>
            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Activity className="size-5" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    8 Pillars
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Financial Health Score</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Continuous diagnostic analyzing emergency runway depth, debt-to-asset leverage, diversification concentration, and inflation-drag vulnerability.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 bg-muted/20 p-3 rounded-xl border border-border/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-2xl font-bold text-foreground">88</span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Excellent Health</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">+3 pts this quarter</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Pillars 7/8 Passing</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[88%]" />
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Card 5: Tax-Loss Harvesting */}
          <FadeIn delay={0.25}>
            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <PiggyBank className="size-5" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    Sec 70 / 74
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Tax-Loss Harvesting</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Automated fiscal scan identifies unrealized short-term equity capital losses before March 31st to offset taxable capital gains under Indian income tax rules.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 bg-muted/20 p-3 rounded-xl border border-border/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">₹42,500 STCL Available</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">Under 20% Bracket</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Net tax saving of <strong className="text-emerald-600 dark:text-emerald-400">₹8,500</strong> for the fiscal year.
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Card 6: Privacy & Sovereign Storage */}
          <FadeIn delay={0.3}>
            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldCheck className="size-5" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Zero-Knowledge
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Sovereign Data Storage</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Your financial privacy is non-negotiable. Zero telemetry, no Account Aggregator credential sharing, and strictly isolated per-user encryption.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 bg-muted/20 p-3 rounded-xl border border-border/40 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Client-Side AES-256 Verified</span>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/signup"
            className="bg-primary text-primary-foreground group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold shadow hover:brightness-95 transition-all"
          >
            <span>Get Started for Free</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
