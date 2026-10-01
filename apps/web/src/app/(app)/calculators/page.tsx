'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calculator, Sparkles } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useEntitlements } from '@/hooks/useEntitlements';
import {
  calculateSipFutureValue,
  calculateLumpsumFutureValue,
  calculatePnL,
  calculateWAC,
} from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { ProLockedButton } from '@/components/shared/ProGate';

type CalcTab = 'sip' | 'averaging' | 'lumpsum' | 'pnl';

const TAB_OPTIONS: { value: CalcTab; label: string }[] = [
  { value: 'sip', label: 'SIP' },
  { value: 'averaging', label: 'Stock Averaging' },
  { value: 'lumpsum', label: 'Lumpsum' },
  { value: 'pnl', label: 'P&L' },
];

const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)'];

/** Parses a calculator input field: blank stays 0 rather than NaN, so a half-typed field never blows up a live formula. */
function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Slider + numeric input combo, groww.in-calculator style — the slider is for quick, feel-based
 * adjustment, the input alongside it for typing an exact value (a slider alone is too imprecise
 * for entering a specific number). */
function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}) {
  const n = num(value);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <div className="relative w-28 shrink-0">
          <Input
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn('h-8 text-right font-mono text-sm tabular-nums', suffix && 'pr-10')}
          />
          {suffix && (
            <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs">
              {suffix}
            </span>
          )}
        </div>
      </div>
      <Slider
        value={[Math.min(Math.max(n, min), max)]}
        onValueChange={([v]) => onChange(String(v))}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

function ResultCard({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'destructive' }) {
  return (
    <div className="bg-muted/60 rounded-2xl p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={`mt-1 font-mono text-xl font-semibold tabular-nums ${
          tone === 'success' ? 'text-success' : tone === 'destructive' ? 'text-destructive' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/** Two-slice donut used by every calculator below — same conventions as ExpenseBreakdownChart
 * (chart token colors, popover-styled tooltip) rather than inventing new chart styling. */
function TwoSlicePie({
  slices,
}: {
  slices: Array<{ name: string; value: number; color?: string }>;
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={180} className="sm:max-w-[180px]">
        <PieChart>
          <Pie data={slices} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70} paddingAngle={2}>
            {slices.map((entry, i) => (
              <Cell key={entry.name} fill={entry.color ?? PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--popover)',
              color: 'var(--popover-foreground)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              fontSize: 12,
            }}
            formatter={(value) => formatINR(Number(value))}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="w-full space-y-2">
        {slices.map((entry, i) => (
          <li key={entry.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: entry.color ?? PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="tabular-nums font-medium">{formatINR(entry.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SipCalculator() {
  const [monthly, setMonthly] = useState('10000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('10');
  const fv = useMemo(() => calculateSipFutureValue(num(monthly), num(rate), num(years)), [monthly, rate, years]);
  const invested = num(monthly) * num(years) * 12;
  const gains = Math.max(fv - invested, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-3">
        <SliderField label="Monthly Amount" value={monthly} onChange={setMonthly} min={500} max={100000} step={500} suffix="₹" />
        <SliderField label="Expected Return" value={rate} onChange={setRate} min={1} max={30} step={0.5} suffix="%" />
        <SliderField label="Duration" value={years} onChange={setYears} min={1} max={40} step={1} suffix="yrs" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ResultCard label="Invested Amount" value={formatINR(invested)} />
        <ResultCard label="Future Value" value={formatINR(fv)} tone="success" />
      </div>
      <TwoSlicePie
        slices={[
          { name: 'Invested', value: invested, color: 'var(--chart-2)' },
          { name: 'Gains', value: gains, color: 'var(--chart-1)' },
        ]}
      />
    </div>
  );
}

function AveragingCalculator() {
  const [qty1, setQty1] = useState('10');
  const [price1, setPrice1] = useState('100');
  const [qty2, setQty2] = useState('10');
  const [price2, setPrice2] = useState('120');
  const wac = useMemo(
    () => calculateWAC([{ qty: num(qty1), price: num(price1) }, { qty: num(qty2), price: num(price2) }]),
    [qty1, price1, qty2, price2]
  );
  const totalQty = num(qty1) + num(qty2);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <SliderField label="Quantity 1" value={qty1} onChange={setQty1} min={1} max={1000} step={1} />
        <SliderField label="Price 1" value={price1} onChange={setPrice1} min={1} max={100000} step={1} suffix="₹" />
        <SliderField label="Quantity 2" value={qty2} onChange={setQty2} min={1} max={1000} step={1} />
        <SliderField label="Price 2" value={price2} onChange={setPrice2} min={1} max={100000} step={1} suffix="₹" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ResultCard label="Total Quantity" value={totalQty.toLocaleString('en-IN')} />
        <ResultCard label="New Average Price" value={formatINR(wac)} tone="success" />
      </div>
      <TwoSlicePie
        slices={[
          { name: 'First Buy', value: num(qty1) * num(price1) },
          { name: 'Second Buy', value: num(qty2) * num(price2) },
        ]}
      />
    </div>
  );
}

function LumpsumCalculator() {
  const [amount, setAmount] = useState('100000');
  const [rate, setRate] = useState('10');
  const [years, setYears] = useState('10');
  const fv = useMemo(() => calculateLumpsumFutureValue(num(amount), num(rate), num(years)), [amount, rate, years]);
  const invested = num(amount);
  const gains = Math.max(fv - invested, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-3">
        <SliderField label="Amount" value={amount} onChange={setAmount} min={1000} max={10000000} step={1000} suffix="₹" />
        <SliderField label="Expected Return" value={rate} onChange={setRate} min={1} max={30} step={0.5} suffix="%" />
        <SliderField label="Duration" value={years} onChange={setYears} min={1} max={40} step={1} suffix="yrs" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ResultCard label="Invested Amount" value={formatINR(invested)} />
        <ResultCard label="Future Value" value={formatINR(fv)} tone="success" />
      </div>
      <TwoSlicePie
        slices={[
          { name: 'Invested', value: invested, color: 'var(--chart-2)' },
          { name: 'Gains', value: gains, color: 'var(--chart-1)' },
        ]}
      />
    </div>
  );
}

function PnlCalculator() {
  const [buyPrice, setBuyPrice] = useState('100');
  const [qty, setQty] = useState('10');
  const [currentPrice, setCurrentPrice] = useState('120');
  const result = useMemo(() => calculatePnL(num(buyPrice), num(qty), num(currentPrice)), [buyPrice, qty, currentPrice]);
  const invested = num(buyPrice) * num(qty);
  const isProfit = result.totalPnl >= 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-3">
        <SliderField label="Buy Price" value={buyPrice} onChange={setBuyPrice} min={1} max={100000} step={1} suffix="₹" />
        <SliderField label="Quantity" value={qty} onChange={setQty} min={1} max={1000} step={1} />
        <SliderField label="Current Price" value={currentPrice} onChange={setCurrentPrice} min={1} max={100000} step={1} suffix="₹" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <ResultCard label="Total P&L" value={formatINR(result.totalPnl)} tone={isProfit ? 'success' : 'destructive'} />
        <ResultCard
          label="% Return"
          value={`${result.pctReturn >= 0 ? '+' : ''}${result.pctReturn.toFixed(2)}%`}
          tone={isProfit ? 'success' : 'destructive'}
        />
        <ResultCard label="Break-Even Price" value={formatINR(result.breakEvenPrice)} />
      </div>
      <TwoSlicePie
        slices={[
          { name: 'Invested', value: invested, color: 'var(--chart-2)' },
          {
            name: isProfit ? 'Gain' : 'Loss',
            value: Math.abs(result.totalPnl),
            color: isProfit ? 'var(--success)' : 'var(--destructive)',
          },
        ]}
      />
    </div>
  );
}

export default function CalculatorsPage() {
  const router = useRouter();
  const { hasFeature } = useEntitlements();
  const [tab, setTab] = useState<CalcTab>('sip');

  if (!hasFeature('financialCalculators')) {
    return (
      <div className="space-y-6">
        <PageHeader title="Calculators" description="SIP, lumpsum, stock averaging, and P&L planning tools." />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Calculator className="text-muted-foreground size-8" />
            <p className="text-sm font-medium">The Financial Calculator Suite is a Pro feature.</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              Start your free trial to unlock SIP, lumpsum, stock averaging, and P&L calculators.
            </p>
            <ProLockedButton label="Unlock Calculators" onUpgradeClick={() => router.push('/settings?tab=billing')} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Calculators" description="SIP, lumpsum, stock averaging, and P&L planning tools." />

      <Card>
        <CardContent className="flex items-start gap-3">
          <Sparkles className="text-info mt-0.5 size-5 shrink-0" />
          <p className="text-muted-foreground text-sm">
            These tools are for planning, not advice — every result is a projection based on the numbers you enter,
            not a guarantee. Actual returns depend on market performance, which nothing here can predict.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={setTab} />

          {tab === 'sip' && <SipCalculator />}
          {tab === 'averaging' && <AveragingCalculator />}
          {tab === 'lumpsum' && <LumpsumCalculator />}
          {tab === 'pnl' && <PnlCalculator />}
        </CardContent>
      </Card>
    </div>
  );
}
