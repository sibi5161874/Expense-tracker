import { ArrowLeft, AlertTriangle, ShieldCheck, Scale, FileText } from 'lucide-react';
import Link from 'next/link';
import { APP_BRANDING } from '@repo/shared/config';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata = {
  title: `Terms of Service — ${APP_BRANDING.name}`,
  description: `Terms and conditions governing the use of ${APP_BRANDING.name} wealth tracking platform.`,
};

export default function TermsPage() {
  return (
    <div className="bg-background text-foreground min-h-full">
      <LandingNavbar />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
          <ArrowLeft className="size-4" />
          Back to {APP_BRANDING.name}
        </Link>

        <header className="mt-8 border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Scale className="size-3.5" /> Terms & Conditions
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Last Updated: November 23, 2026 &bull; Effective Date: November 23, 2026
          </p>
        </header>

        <div className="mt-8 space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, or creating an account on <strong>{APP_BRANDING.name}</strong> (&quot;the Service&quot;), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service and our Privacy Policy. If you do not agree with any part of these terms, you must discontinue use immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Regulatory & Financial Advice Disclaimer</h2>
            <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 text-foreground">
              <strong className="flex items-center gap-2 font-medium text-warning-text">
                <AlertTriangle className="size-4 text-warning" /> IMPORTANT FINANCIAL NOTICE
              </strong>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {APP_BRANDING.name} is a software platform designed solely for personal financial bookkeeping, net worth aggregation, and budgeting. <strong>{APP_BRANDING.name} is NOT a SEBI-registered Investment Adviser (RIA), Research Analyst, Portfolio Manager, Broker, or Chartered Accountant.</strong> Nothing contained on the platform constitutes investment advice, tax consulting, legal counsel, or financial planning. All calculations, including capital gains estimates and net worth projections, are mathematical simulations based on data you provide and should be independently verified with a licensed professional before filing returns or making investment decisions.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. User Accounts and Security</h2>
            <p>
              To access features of the Service, you must register using a valid email address. You are solely responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Subscriptions, Trials & Lifetime Purchases</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong className="text-foreground">Free Tier:</strong> Basic net worth and manual expense logging with limits as detailed on the Pricing page.
              </li>
              <li>
                <strong className="text-foreground">30-Day Pro Trial:</strong> Requires a temporary ₹1 verification charge to authenticate an active payment method. The ₹1 charge is automatically refunded within moments of verification.
              </li>
              <li>
                <strong className="text-foreground">Lifetime Pro License:</strong> A one-time payment providing perpetual access to all Pro features with no recurring monthly subscriptions.
              </li>
              <li>
                <strong className="text-foreground">30-Day Money-Back Guarantee:</strong> Covered by our formal <Link href="/refund-policy" className="text-primary hover:underline">Refund & Cancellation Policy</Link>.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Acceptable Use and Restrictions</h2>
            <p>You agree not to:</p>
            <ul className="list-disc space-y-1.5 pl-6">
              <li>Reverse engineer, decompile, or disassemble any portion of the software.</li>
              <li>Attempt to bypass or tamper with security controls, database access policies (RLS), or billing entitlement checks.</li>
              <li>Scrape, flood, or abuse our APIs or rate limits.</li>
              <li>Use the platform for money laundering, fraudulent bookkeeping, or unauthorized third-party commercial exploitation.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Intellectual Property & User Data Ownership</h2>
            <p>
              All proprietary algorithms, UI designs, trademarks, and documentation are the exclusive property of {APP_BRANDING.name}. You retain 100% ownership of your raw financial data, transaction histories, and asset logs. You may export or permanently delete your data at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, {APP_BRANDING.name} and its operators shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from lost profits, tax miscalculations, market losses, or service interruptions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Governing Law & Jurisdiction</h2>
            <p>
              These Terms shall be governed and interpreted in accordance with the laws of the Republic of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka, India.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Contact Information</h2>
            <p>
              For legal inquiries, support requests, or notifications regarding these Terms:
            </p>
            <div className="rounded-lg border border-border bg-surface p-4 text-xs space-y-1">
              <p><strong className="text-foreground">Support & Legal:</strong> <a href="mailto:support@kashmap.in" className="text-primary hover:underline">support@kashmap.in</a></p>
              <p><strong className="text-foreground">Address:</strong> Bengaluru, Karnataka, India</p>
            </div>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
