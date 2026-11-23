import { ArrowLeft, ShieldCheck, Lock, EyeOff, UserCheck, FileText, Mail } from 'lucide-react';
import Link from 'next/link';
import { APP_BRANDING } from '@repo/shared/config';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata = {
  title: `Privacy Policy — ${APP_BRANDING.name}`,
  description: `Privacy policy and data protection disclosures compliant with India's Digital Personal Data Protection Act (DPDP Act 2023).`,
};

export default function PrivacyPage() {
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
            <ShieldCheck className="size-3.5" /> DPDP Act 2023 Compliant
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Last Updated: November 23, 2026 &bull; Effective Date: November 23, 2026
          </p>
        </header>

        <div className="mt-8 space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Introduction & Data Fiduciary Identity</h2>
            <p>
              This Privacy Policy describes how <strong>{APP_BRANDING.name}</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), operating as a personal wealth intelligence and cash flow platform, collects, processes, and protects your personal data in accordance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the <strong>Information Technology Act, 2000</strong> of India.
            </p>
            <p>
              For the purpose of applicable data protection laws, {APP_BRANDING.name} acts as the <strong>Data Fiduciary</strong> in respect of the personal data provided by users (&quot;Data Principals&quot;) accessing our web application.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Categories of Data We Collect</h2>
            <p>We strictly limit collection to data essential for providing your financial dashboard:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong className="text-foreground">Identity & Authentication Data:</strong> Email address, user identification token, and cryptographic password hashes handled securely via Supabase Auth or Google OAuth.
              </li>
              <li>
                <strong className="text-foreground">Financial & Ledger Data:</strong> Account names, balances, financial institution names, transaction records, categories, cashbook logs, budget configurations, and notes inputted manually or parsed from imported CSV/Excel statements.
              </li>
              <li>
                <strong className="text-foreground">Investment & Asset Records:</strong> Holdings in Indian equities, Mutual Funds, Sovereign Gold Bonds (SGB), Public Provident Fund (PPF), Employee Provident Fund (EPF), National Pension System (NPS), Real Estate valuations, Fixed Deposits, and Insurance policy details.
              </li>
              <li>
                <strong className="text-foreground">Billing & Payment Metadata:</strong> Razorpay order IDs, payment IDs, and transaction timestamps. <em>Note: {APP_BRANDING.name} never stores full debit/credit card numbers or UPI PINs; all payments are processed directly by RBI-authorized payment aggregators (Razorpay).</em>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Purpose of Processing & Strict Non-Disclosure</h2>
            <p>
              Your data is processed solely for the following explicit purposes:
            </p>
            <ul className="list-disc space-y-1.5 pl-6">
              <li>Delivering consolidated net worth calculation, asset allocation analytics, and cash flow trends.</li>
              <li>Generating client-side capital gains tax estimates and CA-ready financial reports.</li>
              <li>Providing transaction search and budgeting insights.</li>
              <li>Account authentication, session security, and abuse prevention.</li>
            </ul>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-foreground">
              <strong className="flex items-center gap-2 font-medium">
                <EyeOff className="size-4 text-primary" /> Our Core Privacy Commitment
              </strong>
              <p className="mt-1 text-xs text-muted-foreground">
                We do not sell, rent, monetize, or trade your personal or financial data to advertising networks, credit bureaus, lenders, or data brokers. Your financial records are isolated with PostgreSQL Row Level Security (RLS) so only your authenticated account can access them.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Data Storage, Security & Encryption</h2>
            <p>
              We implement industry-grade technical and organizational safeguards:
            </p>
            <ul className="list-disc space-y-1.5 pl-6">
              <li><strong>Encryption in Transit:</strong> All communication between your browser and our servers uses TLS 1.3.</li>
              <li><strong>Encryption at Rest:</strong> Database storage and database backups are encrypted with AES-256.</li>
              <li><strong>Row Level Security:</strong> Database policies strictly bind all table queries to your verified authentication UID.</li>
              <li><strong>Zero Permanent Statement Retention:</strong> Uploaded CSV/Excel bank files are parsed directly into your database rows and immediately purged from memory.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Rights of the Data Principal (Under DPDP Act 2023)</h2>
            <p>As a user in India, you are entitled to exercise the following statutory rights:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-3.5">
                <strong className="text-foreground flex items-center gap-1.5"><FileText className="size-4 text-primary" /> Right to Access</strong>
                <p className="mt-1 text-xs">Access a summary of your personal data and processing activities, or export all data anytime in CSV, Excel, or JSON format.</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3.5">
                <strong className="text-foreground flex items-center gap-1.5"><Lock className="size-4 text-primary" /> Right to Correction & Erasure</strong>
                <p className="mt-1 text-xs">Modify incorrect records at any time or permanently purge your account and all associated financial records via Settings &gt; Delete Account.</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3.5">
                <strong className="text-foreground flex items-center gap-1.5"><UserCheck className="size-4 text-primary" /> Right to Nominate</strong>
                <p className="mt-1 text-xs">Nominate an individual to exercise your rights under the DPDP Act in the event of death or incapacity.</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3.5">
                <strong className="text-foreground flex items-center gap-1.5"><Mail className="size-4 text-primary" /> Right to Grievance Redressal</strong>
                <p className="mt-1 text-xs">Reach out to our designated Grievance Officer with any questions or complaints regarding data processing.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Sub-Processors and Third Parties</h2>
            <p>We work with trusted infrastructure providers bound by rigorous confidentiality agreements:</p>
            <ul className="list-disc space-y-1.5 pl-6">
              <li><strong>Supabase Inc.:</strong> Managed PostgreSQL database, authentication, and secure row-level access control.</li>
              <li><strong>Razorpay Software Pvt. Ltd.:</strong> RBI-authorized payment gateway for Indian credit cards, debit cards, NetBanking, and UPI.</li>
              <li><strong>Vercel Inc.:</strong> Application hosting, edge caching, and SSL termination.</li>
              <li><strong>Resend / Upstash:</strong> Transactional email delivery and Redis-based rate limiting.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Grievance Redressal Officer</h2>
            <p>
              In accordance with Section 10 of the DPDP Act 2023 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, the contact details of our Grievance Officer are:
            </p>
            <div className="rounded-lg border border-border bg-surface p-4 text-xs space-y-1">
              <p><strong className="text-foreground">Designation:</strong> Data Grievance Redressal Officer</p>
              <p><strong className="text-foreground">Application:</strong> {APP_BRANDING.name}</p>
              <p><strong className="text-foreground">Email:</strong> <a href="mailto:grievance@kashmap.in" className="text-primary hover:underline">grievance@kashmap.in</a> / <a href="mailto:support@kashmap.in" className="text-primary hover:underline">support@kashmap.in</a></p>
              <p><strong className="text-foreground">Turnaround Time:</strong> Grievances are acknowledged within 48 hours and resolved within 30 days as mandated by law.</p>
            </div>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
