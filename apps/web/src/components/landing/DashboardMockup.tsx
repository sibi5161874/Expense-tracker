'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  FolderLock,
} from 'lucide-react';

export function DashboardMockup() {
  const [selectedRange, setSelectedRange] = useState<'1Y' | '3Y' | '5Y' | 'Max'>('1Y');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="relative w-full max-w-5xl mx-auto"
    >
      {/* Ambient background glow */}
      <div
        className="absolute -inset-4 sm:-inset-8 -z-10 rounded-3xl bg-gradient-to-tr from-primary/15 via-emerald-500/10 to-amber-500/10 blur-3xl"
        aria-hidden
      />

      <div className="rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden transition-all text-foreground">
        {/* Browser Chrome Header */}
        <div className="px-4 py-3 bg-muted/50 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-destructive/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-warning/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-success/80 inline-block"></span>
            <span className="ml-2 font-mono text-[11px] text-muted-foreground hidden sm:inline-block">
              kashmap://vault/primary-ledger
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background border border-border/60 text-foreground font-medium text-xs shadow-xs">
              <FolderLock className="size-3.5 text-primary" />
              <span>Combined Family Wealth</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Synced 2m ago
            </span>
          </div>
        </div>

        {/* Dashboard Canvas */}
        <div className="p-5 sm:p-7 space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Primary Net Worth Hero */}
            <div className="lg:col-span-8 p-6 rounded-2xl bg-muted/20 border border-border/60 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Net Worth
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <TrendingUp className="size-3.5" />
                    +14.2% YoY (▲ ₹18,54,200)
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="font-serif text-3xl sm:text-5xl font-semibold tracking-tight text-foreground">
                    ₹1,48,92,450
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">INR Consolidated</span>
                </div>
              </div>

              {/* Sub-Metrics Strip */}
              <div className="mt-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-border/50">
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">Liquid Capital</p>
                  <p className="font-mono text-sm sm:text-base font-semibold text-foreground mt-0.5">₹26,40,000</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">Invested Capital</p>
                  <p className="font-mono text-sm sm:text-base font-semibold text-foreground mt-0.5">₹1,22,52,450</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">Total Liabilities</p>
                  <p className="font-mono text-sm sm:text-base font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                    ₹14,20,000
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">XIRR Trailing 3Y</p>
                  <p className="font-mono text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    18.64%
                  </p>
                </div>
              </div>
            </div>

            {/* Diagnostic Health Snapshot */}
            <div className="lg:col-span-4 p-6 rounded-2xl bg-muted/20 border border-border/60 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Financial Pulse
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-xs font-semibold">
                  88 / 100
                </span>
              </div>

              <div className="space-y-3.5 my-4">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Emergency Runway</span>
                    <span className="font-semibold text-foreground">14.8 Months</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[85%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Debt-to-Asset Ratio</span>
                    <span className="font-semibold text-foreground">8.7% (Safe)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full w-[15%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Tax-loss Harvest Buffer</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹42,500 Available</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[65%]" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="size-4 shrink-0" />
                <span>Zero structural vulnerabilities detected</span>
              </div>
            </div>
          </div>

          {/* Middle Section: Trajectory Chart & Asset Allocation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Trailing Growth SVG Chart */}
            <div className="lg:col-span-8 p-6 rounded-2xl bg-muted/20 border border-border/60 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Portfolio Trajectory</h3>
                  <p className="text-xs text-muted-foreground">Consolidated rupee value over past 12 reporting cycles</p>
                </div>
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
                  {(['1Y', '3Y', '5Y', 'Max'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setSelectedRange(range)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                        selectedRange === range
                          ? 'bg-background text-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vector Chart with Area Gradient */}
              <div className="relative w-full h-52 pt-2">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 650 200">
                  <defs>
                    <linearGradient id="landingChartGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#15803d" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#15803d" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line x1="0" x2="650" y1="30" y2="30" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                  <line x1="0" x2="650" y1="80" y2="80" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                  <line x1="0" x2="650" y1="130" y2="130" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                  <line x1="0" x2="650" y1="180" y2="180" stroke="currentColor" strokeOpacity="0.15" />

                  {/* Filled Area */}
                  <path
                    d="M 0 170 Q 60 160 110 145 T 220 130 T 330 110 T 440 90 T 550 50 L 650 35 L 650 180 L 0 180 Z"
                    fill="url(#landingChartGrad)"
                  />
                  {/* Smooth Curve Line */}
                  <path
                    d="M 0 170 Q 60 160 110 145 T 220 130 T 330 110 T 440 90 T 550 50 L 650 35"
                    fill="none"
                    stroke="#15803d"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  />
                  {/* Active Pin Point */}
                  <circle cx="550" cy="50" r="5" fill="#15803d" stroke="#ffffff" strokeWidth="2" />
                  <line x1="550" x2="550" y1="50" y2="180" stroke="#15803d" strokeDasharray="2 2" strokeWidth="1.5" />
                </svg>

                {/* Tooltip Float */}
                <div className="absolute top-2 left-[82%] -translate-x-1/2 px-2.5 py-1 rounded-md bg-foreground text-background text-[11px] font-mono shadow-md pointer-events-none">
                  Oct 2024: ₹1.48 Cr
                </div>
              </div>

              {/* Asset Pills Breakdown */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-emerald-600 inline-block" />
                  <span className="text-muted-foreground font-medium">Equities (₹65.5L)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-amber-600 inline-block" />
                  <span className="text-muted-foreground font-medium">Real Estate (₹25.3L)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-blue-600 inline-block" />
                  <span className="text-muted-foreground font-medium">EPF / PPF (₹23.8L)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-amber-500 inline-block" />
                  <span className="text-muted-foreground font-medium">SGBs & 24K (₹26.8L)</span>
                </div>
              </div>
            </div>

            {/* Asset Allocation Donut */}
            <div className="lg:col-span-4 p-6 rounded-2xl bg-muted/20 border border-border/60 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Asset Allocation</h3>
                <p className="text-xs text-muted-foreground">Target balance across 13 native classes</p>
              </div>

              <div className="flex items-center justify-center my-4 relative">
                <svg className="size-36 -rotate-90" viewBox="0 0 100 100">
                  {/* Equities 44% */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#15803d" strokeWidth="12" strokeDasharray="105 133" strokeDashoffset="0" />
                  {/* SGB/Gold 18% */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray="43 195" strokeDashoffset="-105" />
                  {/* EPF/PPF 16% */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#2563eb" strokeWidth="12" strokeDasharray="38 200" strokeDashoffset="-148" />
                  {/* Real Estate 17% */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#b45309" strokeWidth="12" strokeDasharray="40 198" strokeDashoffset="-186" />
                  {/* Liquid 5% */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#64748b" strokeWidth="12" strokeDasharray="12 226" strokeDashoffset="-226" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-serif text-2xl font-bold leading-none text-foreground">13</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Classes</span>
                </div>
              </div>

              {/* Key Holdings Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-background/80 border border-border/40 text-xs">
                  <span className="font-medium text-foreground truncate max-w-[130px]">Parag Parikh Flexi Cap</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">₹18,45,200</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-background/80 border border-border/40 text-xs">
                  <span className="font-medium text-foreground truncate max-w-[130px]">SGB Nov 2030 (RBI)</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">₹12,80,000</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-background/80 border border-border/40 text-xs">
                  <span className="font-medium text-foreground truncate max-w-[130px]">EPFO Passbook UAN</span>
                  <span className="font-mono text-muted-foreground">₹14,92,100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const ALLOCATION = [
  { label: 'Equity', pct: 44, color: '#15803d' },
  { label: 'SGB & Gold', pct: 18, color: '#f59e0b' },
  { label: 'EPF & PPF', pct: 16, color: '#2563eb' },
  { label: 'Real Estate', pct: 17, color: '#b45309' },
  { label: 'Liquid Cash', pct: 5, color: '#64748b' },
];

export function AllocationDonutMockup() {
  const stops = ALLOCATION.map(({ pct, color }, i) => {
    const start = ALLOCATION.slice(0, i).reduce((sum, a) => sum + a.pct, 0);
    return `${color} ${start}% ${start + pct}%`;
  }).join(', ');

  return (
    <div className="border border-border/60 bg-card flex items-center gap-5 rounded-2xl p-5 shadow-sm">
      <div
        className="size-24 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops})` }}
        aria-hidden
      >
        <div className="bg-card m-3 flex size-18 items-center justify-center rounded-full">
          <div className="text-center">
            <span className="block font-serif text-sm font-bold text-foreground">13</span>
            <span className="text-muted-foreground text-[9px] uppercase tracking-wider">Classes</span>
          </div>
        </div>
      </div>
      <ul className="space-y-1.5 text-xs flex-1">
        {ALLOCATION.map(({ label, pct, color }) => (
          <li key={label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
              <span className="text-muted-foreground">{label}</span>
            </span>
            <span className="font-mono font-medium text-foreground tabular-nums">{pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
