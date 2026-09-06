'use client';

import { useEffect, useState } from 'react';
import { Coffee, Copy, Check, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';
import { BMC_URL, UPI_ID, UPI_PAYEE_NAME } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DEFAULT_NOTE = 'Thanks for KashMap!';
const NOTE_PRESETS = [
  { label: 'Casual', value: 'Thanks for KashMap! ☕' },
  { label: 'Formal', value: "Supporting KashMap's development — thank you." },
  { label: 'Cheerful', value: 'Loving the app, keep up the great work! 🎉' },
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

  async function handleCopy() {
    await navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="bg-card border-border/60 flex flex-col items-center justify-center rounded-2xl border p-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-[#FFDD00]/15 text-[#FFDD00]">
          <Coffee className="size-5" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Buy me a coffee</h2>
        <p className="text-muted-foreground mt-1 max-w-xs text-sm">
          If KashMap has been useful to you, a coffee goes a long way — every bit keeps
          development going.
        </p>
        <a
          href={BMC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FFDD00] px-5 py-3 text-sm font-semibold text-black transition-all hover:brightness-95 active:scale-[0.98]"
        >
          <Coffee className="size-4" />
          Buy me a coffee
        </a>
      </div>

      <div className="bg-card border-border/60 flex flex-col rounded-2xl border p-6">
        <h2 className="text-lg font-semibold">Donate via UPI</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Scan the QR code with any UPI app, or tap the button below on your phone.
        </p>

        <div className="mt-4 flex justify-center">
          <div className="bg-background flex size-[168px] items-center justify-center rounded-xl border p-2">
            {qrSvg ? (
              <div className="size-full [&_svg]:size-full" role="img" aria-label="UPI QR code" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            ) : (
              <div className="text-muted-foreground text-xs">Generating QR…</div>
            )}
          </div>
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
                    ? 'bg-primary text-primary-foreground rounded-full px-2.5 py-1 text-xs font-medium'
                    : 'bg-muted text-muted-foreground hover:text-foreground rounded-full px-2.5 py-1 text-xs font-medium transition-colors'
                }
              >
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
