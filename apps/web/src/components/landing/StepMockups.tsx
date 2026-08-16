import { FileSpreadsheet, CheckCircle2 } from 'lucide-react';

/** Step 1 — Import: a bank-statement drop with the real confidence-tier badge language used in the actual import flow. */
export function ImportMockup() {
  return (
    <div className="border-border/60 bg-card space-y-3 rounded-3xl border p-5">
      <div className="border-border/60 bg-muted/60 flex items-center gap-3 rounded-2xl border border-dashed p-4">
        <FileSpreadsheet className="text-primary size-6 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">HDFC_Statement_Aug2026.csv</p>
          <p className="text-muted-foreground text-xs">247 transactions detected</p>
        </div>
      </div>
      <div className="bg-success-subtle text-success flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium">
        <CheckCircle2 className="size-4 shrink-0" />
        Verified format — balances reconciled, safe to import
      </div>
    </div>
  );
}

/** Step 3 — Grow: the app's Financial Essentials score, shown as a simple ring gauge. */
export function EssentialsScoreMockup() {
  const score = 78;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="border-border/60 bg-card flex items-center gap-5 rounded-3xl border p-5">
      <svg viewBox="0 0 100 100" className="size-24 shrink-0 -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-muted)" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="var(--color-success)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <text
          x="50"
          y="55"
          textAnchor="middle"
          className="rotate-90"
          style={{ fontSize: '22px', fontWeight: 700, fill: 'var(--color-foreground)', transform: 'rotate(90deg)', transformOrigin: '50px 50px' }}
        >
          {score}
        </text>
      </svg>
      <div>
        <p className="text-sm font-semibold">Financial Essentials Score</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Recalculated the moment you add an asset, a policy, or pay down a debt — no manual refresh.
        </p>
      </div>
    </div>
  );
}
