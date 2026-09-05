'use client';

import Link from 'next/link';
import { ArrowRight, Scale, Gauge, Landmark, PiggyBank, Building2, Coins, Car, TrendingUp } from 'lucide-react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { FadeIn } from '@/components/landing/FadeIn';

const FEATURES = [
  {
    icon: Scale,
    title: 'Imports that check their own work',
    description:
      "Every bank statement is verified against the file's own running balance before anything is saved — a wrong column mapping gets caught, not silently imported.",
  },
  {
    icon: Gauge,
    title: 'One score for your financial health',
    description:
      'The Financial Essentials score checks your emergency fund, insurance cover, and debt ratio automatically — no spreadsheet math required.',
  },
  {
    icon: Landmark,
    title: 'Built for how India invests',
    description:
      '13 asset classes, from fixed deposits to SGBs — plus statement imports tuned for Indian banks and brokers.',
  },
];

const ASSET_ICONS = [Landmark, PiggyBank, Building2, Coins, Car, TrendingUp];

export default function FeaturesPage() {
  return (
    <div className="bg-background text-foreground min-h-full">
      <LandingNavbar />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Built for transparency, not engagement
          </h1>
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

        <FadeIn delay={0.2} className="mt-10">
          <div className="border-border/60 bg-card flex flex-wrap items-center justify-center gap-x-8 gap-y-4 rounded-3xl border p-6">
            {['Fixed Deposits', 'PPF & NPS', 'Gold & SGB', 'Real Estate', 'Vehicles', 'Stocks & Mutual Funds'].map(
              (label, i) => {
                const Icon = ASSET_ICONS[i % ASSET_ICONS.length]!;
                return (
                  <div key={label} className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Icon className="size-4" />
                    {label}
                  </div>
                );
              }
            )}
            <span className="text-muted-foreground text-sm">+ 7 more asset classes</span>
          </div>
        </FadeIn>

        <FadeIn delay={0.3} className="mt-16 text-center">
          <Link
            href="/signup"
            className="bg-primary text-primary-foreground group inline-flex items-center justify-center gap-1.5 rounded-2xl px-6 py-3.5 text-base font-semibold transition-all hover:brightness-95 active:scale-[0.98]"
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
