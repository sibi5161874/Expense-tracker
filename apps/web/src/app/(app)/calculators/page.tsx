'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calculator, Sparkles } from 'lucide-react';
import { useEntitlements } from '@/hooks/useEntitlements';
import {
  calculateSipFutureValue,
  calculateLumpsumFutureValue,
  calculatePnL,
  calculateWAC,
} from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { PageHeader } from '@/components/shared/PageHeader';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ProLockedButton } from '@/components/shared/ProGate';

type CalcTab = 'sip' | 'averaging' | 'lumpsum' | 'pnl';

const TAB_OPTIONS: { value: CalcTab; label: string }[] = [
  { value: 'sip', label: 'SIP' },
  { value: 'averaging', label: 'Stock Averaging' },
  { value: 'lumpsum', label: 'Lumpsum' },
  { value: 'pnl', label: 'P&L' },
];

/** Parses a calculator input field: blank stays 0 rather than NaN, so a half-typed field never blows up a live formula. */
function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function Field({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={suffix ? "pr-14" : undefined}
        />
        {suffix && (
          <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm">
            {suffix}
          </span>
        )}
      </div>
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

function SipCalculator() {
  const [monthly, setMonthly] = useState('10000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('10');
  const fv = useMemo(() => calculateSipFutureValue(num(monthly), num(rate), num(years)), [monthly, rate, years]);
  const invested = num(monthly) * num(years) * 12;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Field label="Monthly Amount" value={monthly} onChange={setMonthly} suffix="₹" />
        <Field label="Expected Return" value={rate} onChange={setRate} suffix="% p.a." />
        <Field label="Duration" value={years} onChange={setYears} suffix="years" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ResultCard label="Invested Amount" value={formatINR(invested)} />
        <ResultCard label="Future Value" value={formatINR(fv)} tone="success" />
      </div>
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Quantity 1" value={qty1} onChange={setQty1} />
        <Field label="Price 1" value={price1} onChange={setPrice1} suffix="₹" />
        <Field label="Quantity 2" value={qty2} onChange={setQty2} />
        <Field label="Price 2" value={price2} onChange={setPrice2} suffix="₹" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ResultCard label="Total Quantity" value={totalQty.toLocaleString('en-IN')} />
        <ResultCard label="New Average Price" value={formatINR(wac)} tone="success" />
      </div>
    </div>
  );
}

function LumpsumCalculator() {
  const [amount, setAmount] = useState('100000');
  const [rate, setRate] = useState('10');
  const [years, setYears] = useState('10');
  const fv = useMemo(() => calculateLumpsumFutureValue(num(amount), num(rate), num(years)), [amount, rate, years]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Field label="Amount" value={amount} onChange={setAmount} suffix="₹" />
        <Field label="Expected Return" value={rate} onChange={setRate} suffix="% p.a." />
        <Field label="Duration" value={years} onChange={setYears} suffix="years" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ResultCard label="Invested Amount" value={formatINR(num(amount))} />
        <ResultCard label="Future Value" value={formatINR(fv)} tone="success" />
      </div>
    </div>
  );
}

function PnlCalculator() {
  const [buyPrice, setBuyPrice] = useState('100');
  const [qty, setQty] = useState('10');
  const [currentPrice, setCurrentPrice] = useState('120');
  const result = useMemo(() => calculatePnL(num(buyPrice), num(qty), num(currentPrice)), [buyPrice, qty, currentPrice]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Field label="Buy Price" value={buyPrice} onChange={setBuyPrice} suffix="₹" />
        <Field label="Quantity" value={qty} onChange={setQty} />
        <Field label="Current Price" value={currentPrice} onChange={setCurrentPrice} suffix="₹" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <ResultCard label="Total P&L" value={formatINR(result.totalPnl)} tone={result.totalPnl >= 0 ? 'success' : 'destructive'} />
        <ResultCard
          label="% Return"
          value={`${result.pctReturn >= 0 ? '+' : ''}${result.pctReturn.toFixed(2)}%`}
          tone={result.pctReturn >= 0 ? 'success' : 'destructive'}
        />
        <ResultCard label="Break-Even Price" value={formatINR(result.breakEvenPrice)} />
      </div>
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
