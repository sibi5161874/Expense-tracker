import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { APP_BRANDING } from '@repo/shared/config';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata = { title: `Terms of Service — ${APP_BRANDING.name}` };

export default function TermsPage() {
  return (
    <div className="bg-background text-foreground min-h-full">
      <LandingNavbar />
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="size-4" />
          Back to {APP_BRANDING.name}
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
          We&apos;re finalizing the full terms of service before general launch. {APP_BRANDING.name} is
          provided as-is during this early period — please don&apos;t rely on it as your sole record of
          your finances yet, and always keep your own copies of source statements.
        </p>
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
          Questions about how the service works in the meantime? Reach out directly and we&apos;ll help.
        </p>
      </div>
      <LandingFooter />
    </div>
  );
}
