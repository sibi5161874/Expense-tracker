import Link from 'next/link';
import Image from 'next/image';
import { Coffee } from 'lucide-react';
import { APP_BRANDING } from '@repo/shared/config';
import { BMC_URL } from '@/lib/constants';

export function LandingFooter() {
  return (
    <footer className="border-border/60 border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          <div>
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Image src={APP_BRANDING.logoUrl} alt={APP_BRANDING.name} width={32} height={32} className="size-8 rounded-xl" />
              {APP_BRANDING.name}
            </Link>
            <p className="text-muted-foreground mt-3 max-w-xs text-sm">{APP_BRANDING.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:gap-16">
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase">Product</p>
              <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/reports-overview" className="hover:text-foreground transition-colors">Reports</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/donate" className="hover:text-foreground transition-colors">Donate</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase">Legal</p>
              <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-border/60 text-muted-foreground mt-10 flex flex-col gap-4 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {APP_BRANDING.name}. All rights reserved.</p>
          <a
            href={BMC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FFDD00] px-3 py-1.5 font-semibold text-black transition-all hover:brightness-95 active:scale-[0.98]"
          >
            <Coffee className="size-3.5" />
            Buy me a coffee
          </a>
          <p>Made with care in India 🇮🇳</p>
        </div>
      </div>
    </footer>
  );
}
