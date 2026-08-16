import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { APP_BRANDING } from '@repo/shared/config';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata = { title: `Privacy Policy — ${APP_BRANDING.name}` };

export default function PrivacyPage() {
  return (
    <div className="bg-background text-foreground min-h-full">
      <LandingNavbar />
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="size-4" />
          Back to {APP_BRANDING.name}
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
          We&apos;re finalizing the full privacy policy before general launch. In short: your financial
          data is stored under your own account, is never sold or shared with third parties, and
          every table is access-controlled so only you can read your own data.
        </p>
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
          If you have questions about your data before the full policy is published, reach out
          directly and we&apos;ll answer them.
        </p>
      </div>
      <LandingFooter />
    </div>
  );
}
