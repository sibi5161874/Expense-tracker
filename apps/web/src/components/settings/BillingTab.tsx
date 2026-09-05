'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout';
import { usePaymentEvents } from '@/hooks/usePaymentEvents';
import { PAID_TIER_ENABLED, PRICING, FEATURE_GATES } from '@repo/shared/config';
import { formatINR } from '@repo/shared/utils';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import type { PaymentStatus } from '@repo/shared/types';

const PAYMENT_STATUS_TONE: Record<PaymentStatus, 'success' | 'info' | 'warning' | 'destructive'> = {
  captured: 'success',
  refunded: 'info',
  created: 'warning',
  failed: 'destructive',
};

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  captured: 'Paid',
  refunded: 'Refunded',
  created: 'Pending',
  failed: 'Failed',
};

const PAYMENT_PURPOSE_LABEL: Record<string, string> = {
  trial_verification: 'Trial verification charge',
  lifetime_purchase: 'Lifetime purchase',
};

/** Read-only payment history — the closest thing to a reconciliation view this app offers,
 * scoped to the caller's own rows (RLS), not a cross-user admin panel. */
function PaymentHistorySection() {
  const { data: events, isLoading } = usePaymentEvents();

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold">Payment History</h2>
      {isLoading ? (
        <div className="space-y-2.5 py-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-1.5">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      ) : !events || events.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          No payments yet — your trial and purchase charges will show up here.
        </p>
      ) : (
      <ul className="divide-border/60 divide-y">
        {events.map((event) => (
          <li key={event.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <div>
              <p className="font-medium">{PAYMENT_PURPOSE_LABEL[event.purpose] ?? event.purpose}</p>
              <p className="text-muted-foreground text-xs">
                {new Date(event.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="tabular-nums">{formatINR(event.amount_paise / 100)}</span>
              <StatusBadge tone={PAYMENT_STATUS_TONE[event.status]}>{PAYMENT_STATUS_LABEL[event.status]}</StatusBadge>
            </div>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}

const FEATURE_LABELS: Record<string, string> = {
  bankStatementImport: 'Native bank statement import (18 banks)',
  brokerImport: 'Native broker import (Zerodha, Upstox & more)',
  livePriceRefresh: 'Live price refresh (mutual funds + stocks)',
  multiCurrency: 'Multi-currency accounts',
  reportExport: 'PDF & Excel report export',
};

const PRO_ONLY_FEATURE_KEYS = Object.entries(FEATURE_GATES)
  .filter(([, tier]) => tier === 'pro')
  .map(([key]) => key);

/**
 * Real checkout via Razorpay — /api/payments/create-order,
 * useRazorpayCheckout opens the Checkout modal, and the tier change happens
 * server-side in /api/payments/verify once the signature is confirmed. This
 * component only triggers the flow and refreshes the profile query on
 * success; it never writes tier state itself.
 */
export function BillingTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { tier, isPro, isTrialing, trialDaysRemaining, hasUsedTrial } = useEntitlements();
  const { startCheckout, isProcessing, error } = useRazorpayCheckout();

  async function refreshProfile() {
    await queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
  }

  async function handleStartTrial() {
    await startCheckout({
      purpose: 'trial_verification',
      description: `${PRICING.trial.label} — refundable verification charge`,
      userEmail: user?.email,
      onSuccess: async () => {
        await refreshProfile();
        toast.success(`Your ${PRICING.trial.days}-day Pro trial has started. Your ₹${PRICING.trial.verificationChargePaise / 100} charge will be refunded shortly.`);
      },
    });
  }

  async function handlePurchaseLifetime() {
    await startCheckout({
      purpose: 'lifetime_purchase',
      description: `${PRICING.lifetime.label} — one-time purchase`,
      userEmail: user?.email,
      onSuccess: async () => {
        await refreshProfile();
        toast.success("You're on Pro for life. Thank you!");
      },
    });
  }

  if (!PAID_TIER_ENABLED) {
    return (
      <div className="space-y-6">
        <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Current Plan</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Everything is free while paid plans are being set up — no trial, no purchase needed.
              </p>
            </div>
            <StatusBadge tone="neutral">Free</StatusBadge>
          </div>
        </div>

        <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">What&apos;s included</h2>
          <ul className="space-y-2 text-sm">
            {Object.keys(FEATURE_GATES).map((key) => (
              <li key={key} className="flex items-center gap-2">
                <CheckCircle2 className="text-success size-4 shrink-0" />
                {FEATURE_LABELS[key] ?? key}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Current Plan</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {tier === 'pro' && "You're on Pro — thanks for supporting the app."}
              {tier === 'trial' && `You're on a Pro trial — ${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'} left.`}
              {tier === 'free' && "You're on the Free plan."}
            </p>
          </div>
          <StatusBadge tone={isPro ? 'success' : isTrialing ? 'info' : 'neutral'}>
            {tier === 'pro' ? 'Pro' : tier === 'trial' ? 'Trial' : 'Free'}
          </StatusBadge>
        </div>
      </div>

      {error && <p className="text-destructive rounded-lg bg-destructive/10 p-3 text-sm">{error}</p>}

      {!isPro && (
        <div className="grid gap-4 sm:grid-cols-2">
          {PRICING.trial.enabled && (
            <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="text-info size-5" />
                <h3 className="font-semibold">{PRICING.trial.label}</h3>
              </div>
              <p className="text-muted-foreground mb-4 text-sm">
                Try every Pro feature for {PRICING.trial.days} days. A refundable ₹
                {PRICING.trial.verificationChargePaise / 100} charge verifies your payment method — refunded
                automatically within moments of your trial starting.
              </p>
              <Button
                className="w-full"
                onClick={handleStartTrial}
                disabled={isProcessing || hasUsedTrial || isTrialing}
              >
                {isTrialing
                  ? 'Trial Active'
                  : hasUsedTrial
                    ? 'Trial Already Used'
                    : isProcessing
                      ? 'Processing…'
                      : 'Start Free Trial'}
              </Button>
            </div>
          )}

          {PRICING.lifetime.enabled && (
            <div className="border-primary/40 bg-primary/5 rounded-2xl border p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Crown className="text-primary size-5" />
                <h3 className="font-semibold">{PRICING.lifetime.label}</h3>
              </div>
              <p className="mb-1 text-2xl font-semibold tabular-nums">
                {formatINR(PRICING.lifetime.priceRupees)}
                <span className="text-muted-foreground ml-1 text-sm font-normal">one-time</span>
              </p>
              <p className="text-muted-foreground mb-4 text-sm">Pay once, Pro forever. No renewals, ever.</p>
              <Button className="w-full" onClick={handlePurchaseLifetime} disabled={isProcessing}>
                {isProcessing ? 'Processing…' : 'Upgrade to Lifetime'}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">What Pro unlocks</h2>
        <ul className="space-y-2 text-sm">
          {PRO_ONLY_FEATURE_KEYS.map((key) => (
            <li key={key} className="flex items-center gap-2">
              <CheckCircle2 className="text-success size-4 shrink-0" />
              {FEATURE_LABELS[key] ?? key}
            </li>
          ))}
        </ul>
      </div>

      <PaymentHistorySection />
    </div>
  );
}
