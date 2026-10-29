import { Coffee } from 'lucide-react';
import { BMC_PAGE_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface BuyMeACoffeeButtonProps {
  className?: string;
}

/**
 * Hand-built in Buy Me a Coffee's own brand color, rather than their embeddable <script>
 * widget — that widget calls document.write() to inject its button, which every modern
 * browser refuses for a script loaded asynchronously (exactly how React mounts a dynamically
 * created <script> tag), so it silently never rendered anything in this app. A plain link to
 * the real buymeacoffee.com page sidesteps that entirely and needs no CSP script-src allowance.
 */
export function BuyMeACoffeeButton({ className }: BuyMeACoffeeButtonProps) {
  return (
    <a
      href={BMC_PAGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 rounded-2xl bg-[var(--color-bmc)] px-5 py-3 text-sm font-semibold text-black shadow-sm transition-transform hover:scale-[1.03] active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100',
        className
      )}
    >
      <Coffee className="size-4.5" />
      Buy me a coffee
    </a>
  );
}
