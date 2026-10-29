'use client';

import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Receipt, Wallet } from 'lucide-react';
import { PAID_TIER_ENABLED, PRICING, FREE_TIER_LIMITS } from '@repo/shared/config';
import { REPORTS } from '@/lib/reportsRegistry';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { FadeIn } from '@/components/landing/FadeIn';

function formatRupees(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function PricingPage() {
  return (
    <div className="bg-background text-foreground min-h-full">
      <LandingNavbar />

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-medium text-primary">Honest economics</span>
            <h1 className="font-serif text-4xl font-medium tracking-tight mt-2 sm:text-5xl">
              Free to start. Pro to grow.
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">
              {PAID_TIER_ENABLED
                ? `${PRICING.trial.days}-day Pro trial available. No monthly subscription — ever.`
                : 'Pro plans are launching soon — everything is unlocked for free during early access.'}
            </p>
          </FadeIn>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            <FadeIn>
              <div className="border-border/60 bg-card flex h-full flex-col rounded-3xl border p-8">
                <h3 className="text-lg font-semibold">Free</h3>
                <p className="text-muted-foreground mt-1 text-sm">Perfect for getting started</p>
                <p className="font-serif mt-6 text-4xl font-semibold">₹0</p>
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
                <p className="font-serif mt-6 text-4xl font-semibold text-primary">
                  {formatRupees(PRICING.lifetime.priceRupees)}
                  <span className="text-muted-foreground ml-1 text-base font-normal">lifetime</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {[
                    'Everything in Free',
                    'Live quotes, benchmark chart & passive-income projections',
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
                  className="bg-primary text-primary-foreground mt-8 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-[filter,transform] motion-reduce:transition-none hover:brightness-95 active:scale-[0.98]"
                >
                  {PAID_TIER_ENABLED ? `Start ${PRICING.trial.days}-day trial` : 'Get started free'}
                </Link>
              </div>
            </FadeIn>
          </div>
          <p className="text-muted-foreground mt-6 text-center text-xs">
            Free forever. No hidden charges.
            {PAID_TIER_ENABLED &&
              ` ${PRICING.trial.days}-day Pro trial, ₹${PRICING.trial.verificationChargePaise / 100} refundable verification charge.`}
          </p>

          <div className="text-muted-foreground mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="text-success size-3.5" />
              30-day money-back guarantee
            </span>
            <span className="flex items-center gap-1.5">
              <Wallet className="text-success size-3.5" />
              UPI &amp; NetBanking supported
            </span>
            <span className="flex items-center gap-1.5">
              <Receipt className="text-success size-3.5" />
              GST invoice included
            </span>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
