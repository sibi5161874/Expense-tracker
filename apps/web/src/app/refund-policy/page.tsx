import { ArrowLeft, RefreshCw, CheckCircle2, Clock, HelpCircle, Mail } from 'lucide-react';
import Link from 'next/link';
import { APP_BRANDING, PRICING } from '@repo/shared/config';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata = {
  title: `Refund & Cancellation Policy — ${APP_BRANDING.name}`,
  description: `Official 30-day money-back guarantee and refund policy for ${APP_BRANDING.name} Pro lifetime license.`,
};

export default function RefundPolicyPage() {
  return (
    <div className="bg-background text-foreground min-h-full">
      <LandingNavbar />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
          <ArrowLeft className="size-4" />
          Back to {APP_BRANDING.name}
        </Link>

        <header className="mt-8 border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success-text">
            <CheckCircle2 className="size-3.5 text-success" /> 100% Risk-Free Guarantee
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Refund & Cancellation Policy</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Last Updated: November 23, 2026 &bull; Compliant with Consumer Protection (E-Commerce) Rules, 2020
          </p>
        </header>

        <div className="mt-8 space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Our 30-Day Money-Back Guarantee</h2>
            <p>
              At <strong>{APP_BRANDING.name}</strong>, we stand behind the quality and integrity of our wealth intelligence platform. We want you to evaluate our tools with total confidence.
            </p>
            <p>
              If you purchase the <strong>Lifetime Pro License (₹{PRICING.lifetime.priceRupees})</strong> and find that {APP_BRANDING.name} does not meet your expectations for any reason, you are entitled to a <strong>full 100% refund within 30 calendar days</strong> from the date of purchase. No questions asked.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Refund Processing Timeframe</h2>
            <div className="rounded-xl border border-border bg-surface p-4 text-foreground">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <strong className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="size-4 text-primary" /> Turnaround Time
                  </strong>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Refund requests are approved within <strong>24 business hours</strong>. Funds typically appear in your account within <strong>5 to 7 business days</strong> depending on your issuing bank.
                  </p>
                </div>
                <div>
                  <strong className="flex items-center gap-2 text-sm font-medium">
                    <RefreshCw className="size-4 text-primary" /> Original Payment Method
                  </strong>
                  <p className="mt-1 text-xs text-muted-foreground">
                    All refunds are credited directly back to the original source method (UPI, NetBanking, Debit Card, or Credit Card) via our authorized payment aggregator, Razorpay.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Trial Verification Charge (₹1)</h2>
            <p>
              When initiating the 30-day Pro trial, a nominal charge of <strong>₹1</strong> is processed to verify that your payment method is active and authorized.
            </p>
            <p>
              This ₹1 verification charge is <strong>automatically and instantaneously refunded</strong> back to your payment method via Razorpay within moments of verification. You do not need to submit any refund request for trial verification.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. How to Request a Refund</h2>
            <p>
              Initiating a refund is straightforward. You may choose either method:
            </p>
            <ol className="list-decimal space-y-2 pl-6">
              <li>
                <strong className="text-foreground">In-App:</strong> Navigate to <em>Settings &gt; Billing &amp; Invoices</em> and click &quot;Request Refund&quot; under your order history.
              </li>
              <li>
                <strong className="text-foreground">Email Support:</strong> Send an email from your registered account email address to <a href="mailto:support@kashmap.in" className="text-primary hover:underline">support@kashmap.in</a> with the subject line <code>Refund Request — [Your Registered Email]</code> along with your Razorpay Payment ID or Order ID.
              </li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Cancellation Policy</h2>
            <p>
              Because {APP_BRANDING.name} offers a <strong>Lifetime Pro License</strong> rather than a recurring subscription, there are <strong>no recurring monthly or annual charges</strong> to cancel. Once purchased, you will never be billed automatically again.
            </p>
            <p>
              If you wish to terminate your account and wipe all stored data at any time, you can do so instantly via <em>Settings &gt; Delete Account</em>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Contact & Support</h2>
            <p>If you have any questions regarding our policy or have not received your approved refund after 7 business days, please contact our team:</p>
            <div className="rounded-lg border border-border bg-surface p-4 text-xs space-y-1">
              <p><strong className="text-foreground">Support Helpdesk:</strong> <a href="mailto:support@kashmap.in" className="text-primary hover:underline">support@kashmap.in</a></p>
              <p><strong className="text-foreground">Response SLA:</strong> Within 24 business hours</p>
            </div>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
