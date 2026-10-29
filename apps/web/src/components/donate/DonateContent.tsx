'use client';

import { useEffect, useState } from 'react';
import { Coffee, Copy, Check, Smartphone, PartyPopper, HandHeart, type LucideIcon } from 'lucide-react';
import QRCode from 'qrcode';
import { UPI_ID, UPI_PAYEE_NAME, BMC_PAGE_URL } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { BuyMeACoffeeButton } from './BuyMeACoffeeButton';

interface QrFrameProps {
  svg: string | null;
  label: string;
  /** Tailwind arbitrary-value color token (e.g. "var(--color-success)") the corner brackets
   * and tint pick up — lets each panel's QR match its own brand accent. */
  accent: string;
}

/** A plain bordered square reads as an afterthought; the tinted ring + corner brackets give
 * the QR the "scan target" framing fintech apps use, while staying within this design
 * system's existing tokens (no new deps, no SVG asset). */
function QrFrame({ svg, label, accent }: QrFrameProps) {
  return (
    <div
      className="relative rounded-2xl p-3 shadow-sm ring-1"
      style={{
        background: `color-mix(in oklch, ${accent} 8%, transparent)`,
        ['--tw-ring-color' as string]: `color-mix(in oklch, ${accent} 30%, transparent)`,
      }}
    >
      <div className="relative flex size-[152px] items-center justify-center rounded-xl bg-white p-2.5">
        {svg ? (
          <div className="size-full [&_svg]:size-full" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <div className="text-xs text-neutral-400">Generating QR…</div>
        )}
        {(
          [
            '-top-1.5 -left-1.5 rounded-tl-lg border-t-2 border-l-2',
            '-top-1.5 -right-1.5 rounded-tr-lg border-t-2 border-r-2',
            '-bottom-1.5 -left-1.5 rounded-bl-lg border-b-2 border-l-2',
            '-bottom-1.5 -right-1.5 rounded-br-lg border-b-2 border-r-2',
          ] as const
        ).map((pos) => (
          <span key={pos} className={cn('absolute size-5', pos)} style={{ borderColor: accent }} />
        ))}
      </div>
    </div>
  );
}

const DEFAULT_NOTE = 'Thanks for KashMap!';
/** `icon` is shown on the preset chip only — the plain-text `value` is what actually gets
 * sent as the UPI payment note, where an icon glyph can't go. */
const NOTE_PRESETS: { label: string; value: string; icon: LucideIcon }[] = [
  { label: 'Casual', value: 'Thanks for KashMap!', icon: Coffee },
  { label: 'Formal', value: "Supporting KashMap's development — thank you.", icon: HandHeart },
  { label: 'Cheerful', value: 'Loving the app, keep up the great work!', icon: PartyPopper },
];

function buildUpiUri(note: string): string {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_PAYEE_NAME,
    aid: 'uGICAgIDN-LfKBQ',
    cu: 'INR',
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

export function DonateContent() {
  const [note, setNote] = useState(DEFAULT_NOTE);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [bmcQrSvg, setBmcQrSvg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(buildUpiUri(note), { type: 'svg', margin: 1, width: 240 })
      .then((svg) => {
        if (!cancelled) setQrSvg(svg);
      })
      .catch(() => {
        // Keep the last-good QR — a short URI essentially never fails to encode.
      });
    return () => {
      cancelled = true;
    };
  }, [note]);

  // The Buy Me a Coffee page URL never changes, so this QR only needs to render once.
  useEffect(() => {
    let cancelled = false;
    QRCode.toString(BMC_PAGE_URL, { type: 'svg', margin: 1, width: 240 })
      .then((svg) => {
        if (!cancelled) setBmcQrSvg(svg);
      })
      .catch(() => {
        // A static URL essentially never fails to encode — nothing to recover from here.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="bg-card border-border/60 flex flex-col items-center rounded-2xl border p-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--color-bmc)_15%,transparent)] text-[var(--color-bmc)]">
          <Coffee className="size-5" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Buy me a coffee</h2>
        <p className="text-muted-foreground mt-1 max-w-xs text-sm">
          If KashMap has been useful to you, a coffee goes a long way: every bit keeps
          development going.
        </p>

        <div className="mt-4 flex justify-center">
          <QrFrame svg={bmcQrSvg} label="Buy Me a Coffee page QR code" accent="var(--color-bmc)" />
        </div>
        <p className="text-muted-foreground mt-2 text-xs">Scan to open your coffee page, or tap below</p>

        <BuyMeACoffeeButton className="mt-5 flex justify-center" />
      </div>

      <div className="bg-card border-border/60 flex flex-col rounded-2xl border p-6">
        <h2 className="text-lg font-semibold">Donate via UPI</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Scan the QR code with any UPI app, or tap the button below on your phone.
        </p>

        <div className="mt-4 flex justify-center">
          <QrFrame svg={qrSvg} label="UPI QR code" accent="var(--color-success)" />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <code className="bg-muted flex-1 truncate rounded-lg px-3 py-2 text-xs">{UPI_ID}</code>
          <Button type="button" variant="outline" size="icon-sm" onClick={handleCopy} aria-label="Copy UPI ID">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium" htmlFor="upi-note">
            Note to include
          </label>
          <Input id="upi-note" value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5" maxLength={50} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {NOTE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setNote(preset.value)}
                className={
                  note === preset.value
                    ? 'bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium'
                    : 'bg-muted text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors'
                }
              >
                <preset.icon className="size-3" />
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <a
          href={buildUpiUri(note)}
          className="border-border text-foreground hover:bg-muted mt-6 inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors"
        >
          <Smartphone className="size-4" />
          Pay via UPI app
        </a>
      </div>
    </div>
  );
}
