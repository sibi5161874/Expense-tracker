'use client';

import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from 'react';
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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProLockedButton } from '@/components/shared/ProGate';

type CalcTab = 'basic' | 'sip' | 'averaging' | 'lumpsum' | 'pnl';

const TAB_OPTIONS: { value: CalcTab; label: string }[] = [
  { value: 'basic', label: 'Basic' },
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
        <Input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
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

type CalcOperator = '+' | '-' | '×' | '÷';

const MAX_DISPLAY_DIGITS = 15;

/** Applies one pending operator between two operands — shared by the "=" button, chaining a
 * new operator mid-expression (Windows Calculator computes the pending op first), and the
 * keyboard handler, so all three paths can't drift out of sync with each other. */
function applyOperator(a: number, b: number, operator: CalcOperator): number {
  switch (operator) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? NaN : a / b;
  }
}

function formatCalcResult(n: number): string {
  if (!Number.isFinite(n)) return 'Error';
  // Avoid float noise (0.1 + 0.2) without truncating a genuinely long integer result.
  const rounded = Math.round(n * 1e10) / 1e10;
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 10, useGrouping: false });
}

/**
 * A real calculator — display + keypad, same interaction model as Windows Calculator:
 * digits/operators build an expression left to right, an operator commits whatever's pending,
 * and typing on the physical keyboard works identically to clicking the on-screen buttons.
 * Replaces the earlier "two fields and a dropdown" version, which wasn't a calculator so much
 * as a single binary-operation form.
 */
function BasicCalculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [pendingOperator, setPendingOperator] = useState<CalcOperator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const inputDigit = useCallback(
    (digit: string) => {
      if (waitingForOperand || justEvaluated) {
        setDisplay(digit);
        setWaitingForOperand(false);
        setJustEvaluated(false);
        return;
      }
      setDisplay((prev) => {
        if (prev === '0') return digit;
        if (prev.replace('-', '').replace('.', '').length >= MAX_DISPLAY_DIGITS) return prev;
        return prev + digit;
      });
    },
    [waitingForOperand, justEvaluated]
  );

  const inputDecimal = useCallback(() => {
    if (waitingForOperand || justEvaluated) {
      setDisplay('0.');
      setWaitingForOperand(false);
      setJustEvaluated(false);
      return;
    }
    setDisplay((prev) => (prev.includes('.') ? prev : `${prev}.`));
  }, [waitingForOperand, justEvaluated]);

  const clearAll = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setPendingOperator(null);
    setWaitingForOperand(false);
    setJustEvaluated(false);
  }, []);

  const clearEntry = useCallback(() => {
    setDisplay('0');
    setWaitingForOperand(false);
  }, []);

  const backspace = useCallback(() => {
    if (waitingForOperand || justEvaluated) return;
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  }, [waitingForOperand, justEvaluated]);

  const toggleSign = useCallback(() => {
    setDisplay((prev) => (prev === '0' ? prev : prev.startsWith('-') ? prev.slice(1) : `-${prev}`));
  }, []);

  const chooseOperator = useCallback(
    (operator: CalcOperator) => {
      const current = num(display);
      setJustEvaluated(false);
      if (previousValue !== null && pendingOperator && !waitingForOperand) {
        const result = applyOperator(previousValue, current, pendingOperator);
        setPreviousValue(result);
        setDisplay(formatCalcResult(result));
      } else {
        setPreviousValue(current);
      }
      setPendingOperator(operator);
      setWaitingForOperand(true);
    },
    [display, previousValue, pendingOperator, waitingForOperand]
  );

  const equals = useCallback(() => {
    if (previousValue === null || !pendingOperator) return;
    const current = num(display);
    const result = applyOperator(previousValue, current, pendingOperator);
    setDisplay(formatCalcResult(result));
    setPreviousValue(null);
    setPendingOperator(null);
    setWaitingForOperand(false);
    setJustEvaluated(true);
  }, [display, previousValue, pendingOperator]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (/^[0-9]$/.test(e.key)) {
        inputDigit(e.key);
        return;
      }
      switch (e.key) {
        case '.':
          inputDecimal();
          break;
        case '+':
          chooseOperator('+');
          break;
        case '-':
          chooseOperator('-');
          break;
        case '*':
          chooseOperator('×');
          break;
        case '/':
          e.preventDefault(); // browser default is quick-find in some contexts
          chooseOperator('÷');
          break;
        case 'Enter':
        case '=':
          e.preventDefault();
          equals();
          break;
        case 'Backspace':
          backspace();
          break;
        case 'Escape':
          clearAll();
          break;
        case 'Delete':
          clearEntry();
          break;
        default:
          return;
      }
    },
    [inputDigit, inputDecimal, chooseOperator, equals, backspace, clearAll, clearEntry]
  );

  const expression =
    previousValue !== null && pendingOperator
      ? `${formatCalcResult(previousValue)} ${pendingOperator}${waitingForOperand ? '' : ` ${display}`}`
      : ' ';

  const KEYS: { label: string; onPress: () => void; variant?: 'op' | 'muted' | 'equals' }[] = [
    { label: 'CE', onPress: clearEntry, variant: 'muted' },
    { label: 'C', onPress: clearAll, variant: 'muted' },
    { label: '⌫', onPress: backspace, variant: 'muted' },
    { label: '÷', onPress: () => chooseOperator('÷'), variant: 'op' },
    { label: '7', onPress: () => inputDigit('7') },
    { label: '8', onPress: () => inputDigit('8') },
    { label: '9', onPress: () => inputDigit('9') },
    { label: '×', onPress: () => chooseOperator('×'), variant: 'op' },
    { label: '4', onPress: () => inputDigit('4') },
    { label: '5', onPress: () => inputDigit('5') },
    { label: '6', onPress: () => inputDigit('6') },
    { label: '−', onPress: () => chooseOperator('-'), variant: 'op' },
    { label: '1', onPress: () => inputDigit('1') },
    { label: '2', onPress: () => inputDigit('2') },
    { label: '3', onPress: () => inputDigit('3') },
    { label: '+', onPress: () => chooseOperator('+'), variant: 'op' },
    { label: '+/-', onPress: toggleSign },
    { label: '0', onPress: () => inputDigit('0') },
    { label: '.', onPress: inputDecimal },
    { label: '=', onPress: equals, variant: 'equals' },
  ];

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="focus-visible:ring-ring/50 mx-auto max-w-xs space-y-3 rounded-2xl outline-none focus-visible:ring-3"
    >
      <div
        role="textbox"
        aria-label="Calculator display"
        aria-readonly="true"
        onClick={() => containerRef.current?.focus()}
        className="bg-muted/60 cursor-text space-y-1 rounded-2xl p-4 text-right"
      >
        <p className="text-muted-foreground h-4 truncate font-mono text-xs tabular-nums">{expression}</p>
        <p className="truncate font-mono text-3xl font-semibold tabular-nums">{display}</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {KEYS.map((key) => (
          <Button
            key={key.label}
            type="button"
            variant={key.variant === 'muted' ? 'outline' : key.variant === 'op' ? 'secondary' : 'outline'}
            className={cn(
              'h-12 font-mono text-base',
              key.variant === 'equals' && 'bg-primary text-primary-foreground hover:bg-primary/90 col-span-1'
            )}
            onClick={key.onPress}
          >
            {key.label}
          </Button>
        ))}
      </div>

      <p className="text-muted-foreground text-center text-xs">
        Click the display, then type on your keyboard — digits, <code>+ − * /</code>, Enter, and Backspace all work.
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
  const [tab, setTab] = useState<CalcTab>('basic');

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

          {tab === 'basic' && <BasicCalculator />}
          {tab === 'sip' && <SipCalculator />}
          {tab === 'averaging' && <AveragingCalculator />}
          {tab === 'lumpsum' && <LumpsumCalculator />}
          {tab === 'pnl' && <PnlCalculator />}
        </CardContent>
      </Card>
    </div>
  );
}
