'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Wallet, Landmark, TrendingUp } from 'lucide-react';

/**
 * A hand-built stand-in for a real product screenshot, styled with the app's
 * actual design tokens (same --primary/--success/--chart-* colors as the
 * live dashboard) so it reads as "real UI," not stock art. Swap this out for
 * an actual dashboard screenshot once you have one — drop the image in
 * public/images and replace this component's usage in Hero.tsx.
 */
export function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="relative w-full max-w-lg"
    >
      {/* soft glow behind the card */}
      <div className="bg-primary/20 absolute -inset-8 -z-10 rounded-[3rem] blur-3xl" aria-hidden />

      <div className="border-border/60 bg-card overflow-hidden rounded-3xl border p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Net Worth</p>
            <p className="mt-1 font-mono text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
              ₹42,18,650
            </p>
          </div>
          <span className="bg-success-subtle text-success mt-1 inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold">
            <ArrowUpRight className="size-3.5" />
            12.4%
          </span>
        </div>

        {/* Chart */}
        <svg viewBox="0 0 400 130" className="mt-4 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,105 L40,98 L80,100 L120,82 L160,88 L200,62 L240,68 L280,45 L320,50 L360,22 L400,15 L400,130 L0,130 Z"
            fill="url(#netWorthFill)"
          />
          <path
            d="M0,105 L40,98 L80,100 L120,82 L160,88 L200,62 L240,68 L280,45 L320,50 L360,22 L400,15"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="400" cy="15" r="5" fill="var(--color-primary)" />
        </svg>

        {/* KPI tiles */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { label: 'Assets', value: '₹48.2L', icon: Landmark },
            { label: 'Investments', value: '₹31.4L', icon: TrendingUp },
            { label: 'Liabilities', value: '₹6.0L', icon: Wallet },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-muted/60 rounded-2xl p-3">
              <Icon className="text-muted-foreground size-4" />
              <p className="mt-2 font-mono text-sm font-semibold tabular-nums">{value}</p>
              <p className="text-muted-foreground text-[11px]">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const ALLOCATION = [
  { label: 'Equity', pct: 42, color: 'var(--color-chart-1)' },
  { label: 'Debt', pct: 24, color: 'var(--color-chart-2)' },
  { label: 'Gold', pct: 14, color: 'var(--color-chart-3)' },
  { label: 'Real Estate', pct: 12, color: 'var(--color-chart-4)' },
  { label: 'Cash', pct: 8, color: 'var(--color-chart-5)' },
];

/** Small allocation donut, styled the same way, used in the "Analyze" step. */
export function AllocationDonutMockup() {
  const stops = ALLOCATION.map(({ pct, color }, i) => {
    const start = ALLOCATION.slice(0, i).reduce((sum, a) => sum + a.pct, 0);
    return `${color} ${start}% ${start + pct}%`;
  }).join(', ');

  return (
    <div className="border-border/60 bg-card flex items-center gap-5 rounded-3xl border p-5">
      <div
        className="size-24 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops})` }}
        aria-hidden
      >
        <div className="bg-card m-3.5 flex size-17 items-center justify-center rounded-full">
          <span className="text-muted-foreground text-[10px] font-medium">Allocation</span>
        </div>
      </div>
      <ul className="space-y-1.5 text-xs">
        {ALLOCATION.map(({ label, pct, color }) => (
          <li key={label} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono font-medium tabular-nums">{pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
