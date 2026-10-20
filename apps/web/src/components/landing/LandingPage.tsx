'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Zap,
  CheckCircle2,
  PieChart,
  UploadCloud,
  Activity,
  FileCheck2,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { PAID_TIER_ENABLED, PRICING, FREE_TIER_LIMITS } from '@repo/shared/config';
import { REPORTS } from '@/lib/reportsRegistry';
import { PROMO_VIDEO_YOUTUBE_URL } from '@/lib/constants';
import { toYoutubeEmbedUrl } from '@/lib/youtube';
import { LandingNavbar } from './LandingNavbar';
import { LandingFooter } from './LandingFooter';
import { FadeIn } from './FadeIn';
import { DashboardMockup } from './DashboardMockup';

const TRUST_BAR_ITEMS = [
  {
    icon: Lock,
    title: 'Bank-Grade Security',
    description: '256-bit client AES encryption with zero-knowledge architecture.',
  },
  {
    icon: Sparkles,
    title: 'Made for India',
    description: 'Native support for EPF/PPF, SGBs, Zerodha, Groww & CAMS.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy-First',
    description: 'Zero telemetry, zero analytics tracking, your data is never sold.',
  },
  {
    icon: Zap,
    title: 'Client-Side Decryption',
    description: 'All statement parsing and encryption happens right in your browser.',
  },
];

function formatRupees(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export function LandingPage() {
  const promoVideoEmbedUrl = toYoutubeEmbedUrl(PROMO_VIDEO_YOUTUBE_URL);
  const trimmedVideoUrl = PROMO_VIDEO_YOUTUBE_URL.trim();
  const isDirectVideo =
    !promoVideoEmbedUrl &&
    Boolean(
      trimmedVideoUrl &&
        (trimmedVideoUrl.startsWith('/') ||
          /\.(mp4|webm|ogg|mov)($|\?)/i.test(trimmedVideoUrl))
    );
  const hasPromoVideo = Boolean(promoVideoEmbedUrl || isDirectVideo);

  return (
    <div className="bg-background text-foreground min-h-full">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 px-4 sm:px-6 lg:px-12">
        {/* Subtle radial aura */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-primary/15 via-emerald-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          {/* Announcement Pill */}
          <Link
            href="/reports-overview"
            className="group mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground transition-all hover:bg-muted hover:text-foreground shadow-xs"
          >
            <span className="font-semibold text-amber-500">✦</span>
            <span>KashMap 2.4 Released — Bank-grade client-side encryption • 16 new CA-ready tax reports</span>
            <ArrowRight className="size-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-foreground max-w-4xl mx-auto leading-[1.08]"
          >
            Master your net worth.<br className="hidden sm:inline" />
            <span className="text-primary italic font-normal"> Your data, your rules.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-muted-foreground mt-5 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed text-balance"
          >
            Stop guessing your finances across fragmented spreadsheets. One dashboard for every asset, liability, and rupee moving through your accounts — built for how India actually invests.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/signup"
              className="bg-primary text-primary-foreground group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold shadow-md transition-all hover:brightness-95 active:scale-[0.98]"
            >
              <span className="font-serif text-lg leading-none">₹</span>
              <span>Get Started Free</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/how-it-works"
              className="border border-border/80 bg-card hover:bg-muted text-foreground inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-medium transition-colors"
            >
              <span>See How It Works</span>
            </Link>
          </motion.div>

          {/* Trust points */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Check className="size-3.5 text-emerald-600" />
              No credit card required
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="flex items-center gap-1.5">
              <Check className="size-3.5 text-emerald-600" />
              Zero bank credentials stored
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="flex items-center gap-1.5">
              <Check className="size-3.5 text-emerald-600" />
              Proprietary client-side encryption
            </span>
          </div>

          {/* High-Fidelity Dashboard Mockup */}
          <div className="w-full mt-12 sm:mt-16">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* Trust Pillars Bar */}
      <section className="border-y border-border/60 bg-muted/30 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST_BAR_ITEMS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-start gap-3.5 p-4 rounded-xl bg-card border border-border/60 shadow-xs"
              >
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Video (if configured) */}
      {hasPromoVideo && (
        <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
          <FadeIn>
            <div className="border border-border/60 bg-black aspect-video overflow-hidden rounded-2xl shadow-xl">
              {promoVideoEmbedUrl ? (
                <iframe
                  src={promoVideoEmbedUrl}
                  title="KashMap demo video"
                  className="size-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  src={trimmedVideoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="size-full object-cover"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </FadeIn>
        </section>
      )}

      {/* Features Grid (Bento Style) */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <FadeIn className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Bank-Grade Architecture
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground mt-2">
            Built for how Indians actually build wealth.
          </h2>
          <p className="text-muted-foreground mt-3 text-base leading-relaxed">
            From municipal land records to NSDL depository folios, manage your entire fiscal existence with unmatched privacy and proprietary security.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: 13 Asset Classes */}
          <FadeIn delay={0.1}>
            <div className="p-6 sm:p-7 rounded-2xl bg-card border border-border/60 shadow-xs h-full flex flex-col justify-between">
              <div>
                <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-5">
                  <PieChart className="size-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">13 Native Asset Classes</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Seamlessly tracks Indian Equities, Direct MF folios, SGBs, Physical Gold, Real Estate, EPF/PPF, NPS, FDs, and liabilities with automated valuation updates.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-border/50">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2.5">
                  Supported Sources
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Zerodha', 'Groww', 'CAMS', 'KFintech', 'EPFO', 'DigiLocker'].map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-medium text-foreground border border-border/40"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Card 2: Import Statement */}
          <FadeIn delay={0.2}>
            <div className="p-6 sm:p-7 rounded-2xl bg-card border border-border/60 shadow-xs h-full flex flex-col justify-between">
              <div>
                <div className="size-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5">
                  <UploadCloud className="size-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Import, Don&apos;t Retype</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Drop CAS PDF statements, Zerodha/Groww tradebooks, bank statements, or custom CSVs. KashMap parses, reconciles duplicates, and maps holdings in under 3 seconds.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-border/50 bg-muted/20 p-3 rounded-xl border border-border/40">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-mono font-medium truncate">CAMS_CAS_Sept2024.pdf</span>
                  </div>
                  <span className="text-muted-foreground text-[11px]">1.8 MB</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-full" />
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2">
                  28 MF Folios &amp; 14 Demat holdings reconciled
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Card 3: Financial Health Score */}
          <FadeIn delay={0.3}>
            <div className="p-6 sm:p-7 rounded-2xl bg-card border border-border/60 shadow-xs h-full flex flex-col justify-between">
              <div>
                <div className="size-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5">
                  <Activity className="size-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Financial Health Score</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Instant diagnostic across 8 vital pillars: Emergency runway depth, debt-to-income leverage, portfolio concentration, insurance adequacy, and inflation drag.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-border/50 bg-muted/20 p-3 rounded-xl border border-border/40 flex items-center justify-between">
                <div>
                  <span className="font-serif text-3xl font-bold text-foreground">
                    88<span className="text-xs text-muted-foreground font-normal">/100</span>
                  </span>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Excellent Health
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <TrendingUp className="size-3.5" />
                  +3 pts this quarter
                </span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Product Showcase: Interactive Statement Parser & Tax Optimization */}
      <section className="border-y border-border/60 bg-muted/20 py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-20">
          {/* Row 1: Statement Parser */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Frictionless Ingestion
              </span>
              <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground leading-tight">
                Drop your statements. Watch your portfolio map itself.
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Tired of manually updating Google Sheets every weekend? Import CAMS, KFintech, Zerodha, Groww, ICICI Direct, and bank CSVs with automated deduplication and capital gains classification.
              </p>
              <ul className="space-y-2.5 pt-2 text-sm text-foreground">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Automatic dividend and corporate action tracking</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>FIFO capital gains calculation (STCG 20% &amp; LTCG 12.5% as per Budget 2024)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Zero bank passwords or Account Aggregator credential sharing needed</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-md">
                <div className="flex items-center justify-between pb-4 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="size-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Consolidated Statement Parser</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-muted text-muted-foreground">
                    Client-Side FIFO
                  </span>
                </div>

                <div className="my-4 p-5 rounded-xl bg-muted/30 border border-dashed border-border/80 text-center">
                  <FileCheck2 className="size-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">CAS_Consolidated_2024.pdf</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                    ✓ Parsed 28 records in 1.4s with 100% confidence
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground font-semibold uppercase text-[10px]">
                        <th className="p-2.5 rounded-l">ISIN / Asset</th>
                        <th className="p-2.5">Units</th>
                        <th className="p-2.5">Latest NAV</th>
                        <th className="p-2.5 rounded-r">Tax Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-xs">
                      <tr>
                        <td className="p-2.5 font-sans font-medium text-foreground">SBI Bluechip Fund (Dir)</td>
                        <td className="p-2.5 text-muted-foreground">4,120.45</td>
                        <td className="p-2.5 text-foreground">₹89.40</td>
                        <td className="p-2.5 font-sans">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                            LTCG (12.5%)
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-sans font-medium text-foreground">Reliance Industries Ltd</td>
                        <td className="p-2.5 text-muted-foreground">250.00</td>
                        <td className="p-2.5 text-foreground">₹2,840.10</td>
                        <td className="p-2.5 font-sans">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                            LTCG (12.5%)
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-sans font-medium text-foreground">SGB Nov 2030 (RBI)</td>
                        <td className="p-2.5 text-muted-foreground">100.00</td>
                        <td className="p-2.5 text-foreground">₹7,650.00</td>
                        <td className="p-2.5 font-sans">
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                            Tax-Free at Maturity
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Tax Optimization */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1">
              <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Tax-Loss Harvesting Engine
                    </span>
                    <h3 className="text-base font-semibold text-foreground">FY 2024-25 Optimization</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono text-xs font-semibold">
                    ₹42,500 STCL Identified
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Tata Motors Ltd (DVR)</p>
                      <p className="text-xs text-muted-foreground">Unrealized Short-Term Loss: ₹24,000 • 32 days held</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-background text-xs font-medium border border-border/60">
                      Eligible
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">HDFC Life Insurance Co</p>
                      <p className="text-xs text-muted-foreground">Unrealized Short-Term Loss: ₹18,500 • 78 days held</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-background text-xs font-medium border border-border/60">
                      Eligible
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-medium text-foreground">
                      Net Tax Saved This Fiscal: <strong className="text-emerald-600 dark:text-emerald-400">₹8,500</strong>
                    </span>
                  </div>
                  <span className="text-muted-foreground font-medium">Under 20% STCG Bracket</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4 order-1 lg:order-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Holistic Diagnostics
              </span>
              <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground leading-tight">
                The Financial Essentials Check: Know where you stand before you retire.
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                KashMap simulates market drawdowns, inflation adjustments, and tax-loss harvesting windows to deliver a comprehensive diagnosis of your sovereign financial health.
              </p>
              <ul className="space-y-2.5 pt-2 text-sm text-foreground">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>16 advanced CA-ready reports downloadable in Excel/PDF</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Automated tax-loss harvesting alert matrix for year-end savings</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Emergency fund runway calculator based on actual trailing burn rate</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 sm:px-6 py-24">
        <FadeIn className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Simple Pricing. No Subscriptions. No Hidden Fees.
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-foreground mt-2">
            Free to start. Upgrade once, own it forever.
          </h2>
          <p className="text-muted-foreground mt-3 text-base">
            Start tracking your net worth today with zero commitments, or unlock lifetime automated sync and professional tax intelligence.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Plan 1: Free */}
          <FadeIn>
            <div className="p-8 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-foreground">Free</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                    Free Forever
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5">Start tracking your net worth today.</p>

                <div className="my-6">
                  <span className="font-serif text-5xl font-semibold text-foreground">₹0</span>
                  <span className="text-sm text-muted-foreground"> / lifetime</span>
                </div>

                <ul className="space-y-3 pt-3 text-sm border-t border-border/50">
                  <li className="flex items-center gap-2.5 text-foreground">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Unlimited manual transactions</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-foreground">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Up to {FREE_TIER_LIMITS.maxAssets} tracked assets</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-foreground">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>Local client-side encrypted storage</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-foreground">
                    <Check className="size-4 text-emerald-600 shrink-0" />
                    <span>View all {REPORTS.length} financial reports on-screen</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-5">
                <Link
                  href="/signup"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-semibold transition-colors"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </FadeIn>

          {/* Plan 2: Pro */}
          <FadeIn delay={0.1}>
            <div className="p-8 rounded-2xl bg-card border-2 border-primary shadow-lg flex flex-col justify-between h-full relative">
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-amber-500 text-black text-xs font-bold uppercase tracking-wider shadow-xs">
                Best Value
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-foreground">KashMap Pro</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    One-Time Unlock
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Lifetime access. Unlimited assets, live quotes, bank imports, and full exports.
                </p>

                <div className="my-6">
                  <span className="font-serif text-5xl font-semibold text-primary">
                    {formatRupees(PRICING.lifetime.priceRupees)}
                  </span>
                  <span className="text-sm text-muted-foreground"> / single payment</span>
                </div>

                <ul className="space-y-3 pt-3 text-sm border-t border-border/50">
                  <li className="flex items-center gap-2.5 text-foreground font-medium">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>Everything in Free, plus:</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-foreground">
                    <Check className="size-4 text-primary shrink-0" />
                    <span>Unlimited assets &amp; accounts</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-foreground">
                    <Check className="size-4 text-primary shrink-0" />
                    <span>Automated broker/bank CAS CSV statement imports</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-foreground">
                    <Check className="size-4 text-primary shrink-0" />
                    <span>Live price updates &amp; Nifty 50 benchmark tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-foreground">
                    <Check className="size-4 text-primary shrink-0" />
                    <span>All {REPORTS.length} CA-ready reports downloadable in Excel/PDF</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-foreground">
                    <Check className="size-4 text-primary shrink-0" />
                    <span>Tax-loss harvesting alert matrix &amp; multi-currency FX</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-5">
                <Link
                  href="/signup"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow hover:brightness-95 transition-all"
                >
                  <span>
                    {PAID_TIER_ENABLED
                      ? `Start ${PRICING.trial.days}-Day Trial`
                      : `Get KashMap Pro (${formatRupees(PRICING.lifetime.priceRupees)} Lifetime) →`}
                  </span>
                </Link>
                <p className="text-[11px] text-muted-foreground text-center mt-2.5">
                  30-day money-back guarantee • No recurring subscriptions ever
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-foreground text-background py-16 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight">
            Take sovereign control of your Indian wealth today.
          </h2>
          <p className="text-background/70 text-base sm:text-lg max-w-2xl mx-auto">
            Join over 12,000+ Indian investors tracking ₹1,800+ Crores in assets securely on their own terms.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground text-base font-semibold shadow hover:brightness-95 transition-all"
            >
              <span>Get Started Free</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-background/10 hover:bg-background/20 text-background text-base font-medium transition-colors"
            >
              <span>Explore Architecture</span>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
