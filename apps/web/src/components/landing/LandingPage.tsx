'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  UserCheck,
  Scale,
  Gauge,
  Landmark,
  PiggyBank,
  Building2,
  Coins,
  Car,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { PAID_TIER_ENABLED, PRICING, FREE_TIER_LIMITS } from '@repo/shared/config';
import { REPORTS } from '@/lib/reportsRegistry';
import { PROMO_VIDEO_YOUTUBE_URL } from '@/lib/constants';
import { toYoutubeEmbedUrl } from '@/lib/youtube';
import { LandingNavbar } from './LandingNavbar';
import { LandingFooter } from './LandingFooter';
import { FadeIn } from './FadeIn';
import { DashboardMockup, AllocationDonutMockup } from './DashboardMockup';
import { ImportMockup, EssentialsScoreMockup } from './StepMockups';

const TRUST_ITEMS = [
  { icon: Lock, label: 'No third-party tracking' },
  { icon: ShieldCheck, label: 'Your data stays yours' },
  { icon: UserCheck, label: 'Built by a solo developer' },
];

const FEATURES = [
  {
    icon: Scale,
    title: 'Imports that check their own work',
    description: "Every bank statement is verified against the file's own running balance before anything is saved — a wrong column mapping gets caught, not silently imported.",
  },
  {
    icon: Gauge,
    title: 'One score for your financial health',
    description: 'The Financial Essentials score checks your emergency fund, insurance cover, and debt ratio automatically — no spreadsheet math required.',
  },
  {
    icon: Landmark,
    title: 'Built for how India invests',
    description: '13 asset classes, from fixed deposits to SGBs — plus statement imports tuned for Indian banks and brokers.',
  },
];

const ASSET_ICONS = [Landmark, PiggyBank, Building2, Coins, Car, TrendingUp];

const STEPS = [
  {
    label: 'Step 1',
    title: 'Import',
    description: 'Drop in a bank or broker statement CSV — 28 institutions supported, from HDFC to Zerodha. Duplicates are skipped automatically on every re-import.',
    mockup: <ImportMockup />,
  },
  {
    label: 'Step 2',
    title: 'Analyze',
    description: 'See exactly where your money sits — across cash, equity, debt, gold, and real estate — in one allocation view.',
    mockup: <AllocationDonutMockup />,
  },
  {
    label: 'Step 3',
    title: 'Grow',
    description: 'Track your Financial Essentials score and goal progress as your numbers move, month over month.',
    mockup: <EssentialsScoreMockup />,
  },
];

function formatRupees(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export function LandingPage() {
  const promoVideoEmbedUrl = toYoutubeEmbedUrl(PROMO_VIDEO_YOUTUBE_URL);

  return (
    <div className="bg-background text-foreground min-h-full">
      <LandingNavbar />

      {/* Hero */}
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:flex-row lg:items-center lg:gap-8 lg:pt-28">
        <div className="max-w-xl text-center lg:text-left">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            Master your net worth.{' '}
            <span className="text-primary">Your data, your rules.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-muted-foreground mt-5 text-lg text-balance"
          >
            Stop guessing your expenses across fragmented spreadsheets. One dashboard for every
            asset, liability, and rupee moving through your accounts — built for how India
            actually invests.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
          >
            <Link
              href="/signup"
              className="bg-primary text-primary-foreground group inline-flex w-full items-center justify-center gap-1.5 rounded-2xl px-6 py-3.5 text-base font-semibold transition-all hover:brightness-95 active:scale-[0.98] sm:w-auto"
            >
              Get started for free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/pricing"
              className="border-border text-foreground hover:bg-muted inline-flex w-full items-center justify-center rounded-2xl border px-6 py-3.5 text-base font-semibold transition-colors sm:w-auto"
            >
              See pricing
            </Link>
          </motion.div>
          <p className="text-muted-foreground mt-3 text-xs">No credit card required to start.</p>
        </div>

        <div className="flex w-full justify-center lg:w-auto lg:flex-1 lg:justify-end">
          <DashboardMockup />
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-border/60 bg-muted/40 border-y">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-6 sm:px-6">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <Icon className="text-primary size-4" />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* Promo video — hidden entirely when PROMO_VIDEO_YOUTUBE_URL (lib/constants.ts) is empty or unparseable */}
      {promoVideoEmbedUrl && (
        <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
          <FadeIn>
            <div className="border-border/60 aspect-video overflow-hidden rounded-3xl border shadow-lg">
              <iframe
                src={promoVideoEmbedUrl}
                title="KashMap promo video"
                className="size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </FadeIn>
        </section>
      )}

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for transparency, not engagement
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Every feature exists to answer one question honestly: where does your money actually stand.
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }, i) => (
            <FadeIn key={title} delay={i * 0.1}>
              <div className="border-border/60 bg-card h-full rounded-3xl border p-6">
                <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl">
                  <Icon className="size-5.5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{description}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Asset classes strip */}
        <FadeIn delay={0.2} className="mt-10">
          <div className="border-border/60 bg-card flex flex-wrap items-center justify-center gap-x-8 gap-y-4 rounded-3xl border p-6">
            {[
              'Fixed Deposits', 'PPF & NPS', 'Gold & SGB', 'Real Estate', 'Vehicles', 'Stocks & Mutual Funds',
            ].map((label, i) => {
              const Icon = ASSET_ICONS[i % ASSET_ICONS.length]!;
              return (
                <div key={label} className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Icon className="size-4" />
                  {label}
                </div>
              );
            })}
            <span className="text-muted-foreground text-sm">+ 7 more asset classes</span>
          </div>
        </FadeIn>
      </section>

      {/* How it works */}
      <section className="border-border/60 bg-muted/40 border-y py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
            <p className="text-muted-foreground mt-4 text-lg">Three steps from a pile of statements to a clear picture.</p>
          </FadeIn>

          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {STEPS.map(({ label, title, description, mockup }, i) => (
              <FadeIn key={title} delay={i * 0.12}>
                <div className="flex h-full flex-col">
                  <span className="text-primary text-xs font-semibold tracking-wide uppercase">{label}</span>
                  <h3 className="mt-1 text-xl font-semibold">{title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{description}</p>
                  <div className="mt-5">{mockup}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Reports showcase */}
      <section id="reports" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {REPORTS.length} ways to see your wealth. All free to view.
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            From monthly cash flow to portfolio P&amp;L — every report ships in the free tier.
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REPORTS.slice(0, 8).map((report, i) => (
            <FadeIn key={report.slug} delay={(i % 4) * 0.06}>
              <div className="border-border/60 bg-card h-full rounded-2xl border p-5">
                <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                  {report.category}
                </span>
                <h3 className="mt-1.5 text-sm font-semibold">{report.title}</h3>
                <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">{report.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.3} className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            + {REPORTS.length - 8} more, including Asset Maturity Calendar and Cashbook Net Position.
          </p>
        </FadeIn>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-border/60 bg-muted/40 border-y py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Free to start. Pro to grow.</h2>
            <p className="text-muted-foreground mt-4 text-lg">
              {PAID_TIER_ENABLED
                ? `${PRICING.trial.days}-day Pro trial available. No monthly subscription — ever.`
                : "Pro plans are launching soon — everything is unlocked for free during early access."}
            </p>
          </FadeIn>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            <FadeIn>
              <div className="border-border/60 bg-card flex h-full flex-col rounded-3xl border p-8">
                <h3 className="text-lg font-semibold">Free</h3>
                <p className="text-muted-foreground mt-1 text-sm">Perfect for getting started</p>
                <p className="mt-6 text-4xl font-semibold">₹0</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {[
                    'Unlimited transactions',
                    `Up to ${FREE_TIER_LIMITS.maxAssets} tracked assets`,
                    `View all ${REPORTS.length} reports`,
                    'Recurring transactions',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="border-border text-foreground hover:bg-muted mt-8 inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors"
                >
                  Get started free
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="border-primary bg-card relative flex h-full flex-col rounded-3xl border-2 p-8">
                <span className="bg-primary text-primary-foreground absolute -top-3 left-8 rounded-full px-3 py-1 text-xs font-semibold">
                  For serious wealth builders
                </span>
                <h3 className="text-lg font-semibold">Pro</h3>
                <p className="text-muted-foreground mt-1 text-sm">{PRICING.lifetime.label}, one payment</p>
                <p className="mt-6 text-4xl font-semibold">
                  {formatRupees(PRICING.lifetime.priceRupees)}
                  <span className="text-muted-foreground ml-1 text-base font-normal">lifetime</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {[
                    'Everything in Free',
                    'Live price refresh (stocks & mutual funds)',
                    'Bank & broker statement import',
                    'Multi-currency accounts',
                    'PDF & Excel report exports',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="bg-primary text-primary-foreground mt-8 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all hover:brightness-95 active:scale-[0.98]"
                >
                  {PAID_TIER_ENABLED ? `Start ${PRICING.trial.days}-day trial` : 'Get started free'}
                </Link>
              </div>
            </FadeIn>
          </div>
          <p className="text-muted-foreground mt-6 text-center text-xs">
            Free forever. No hidden charges.
            {PAID_TIER_ENABLED && ` ${PRICING.trial.days}-day Pro trial, ₹${PRICING.trial.verificationChargePaise / 100} refundable verification charge.`}
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
        <FadeIn>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Your money deserves a clear picture.
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-lg text-lg">
            Set it up in minutes. No spreadsheets, no guesswork, no data leaving your account.
          </p>
          <Link
            href="/signup"
            className="bg-primary text-primary-foreground group mt-8 inline-flex items-center justify-center gap-1.5 rounded-2xl px-7 py-3.5 text-base font-semibold transition-all hover:brightness-95 active:scale-[0.98]"
          >
            Get started for free
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </FadeIn>
      </section>

      <LandingFooter />
    </div>
  );
}
