'use client';

import { useState, useTransition } from 'react';
import { Sparkles, ArrowRight, CornerDownLeft, Receipt, Users, TrendingUp } from 'lucide-react';
import { parseTransactionText, type ParsedQuickAddResult } from '@repo/shared/logic';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TransactionForm } from '@/components/TransactionForm';
import { CashbookForm } from '@/components/CashbookForm';
import { InvestmentForm } from '@/components/InvestmentForm';
import { cn } from '@/lib/utils';
import type { TransactionInput, CashbookInput, InvestmentLogInput } from '@repo/shared/schemas';

interface QuickAddInputProps {
  onSuccess?: () => void;
  className?: string;
}

export function QuickAddInput({ onSuccess, className }: QuickAddInputProps) {
  const [text, setText] = useState('');
  const [isPending, startTransition] = useTransition();
  const { data: categories } = useCategories();

  // Active form modal states
  const [activeModal, setActiveModal] = useState<'transaction' | 'cashbook' | 'investment' | null>(null);
  const [transactionPrefill, setTransactionPrefill] = useState<Partial<TransactionInput> | null>(null);
  const [cashbookPrefill, setCashbookPrefill] = useState<Partial<CashbookInput> | null>(null);
  const [investmentPrefill, setInvestmentPrefill] = useState<Partial<InvestmentLogInput> | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    startTransition(() => {
      const parsed: ParsedQuickAddResult = parseTransactionText(trimmed);

      if (parsed.intent === 'cashbook' && parsed.cashbook) {
        setCashbookPrefill({
          flow: parsed.cashbook.flow,
          amount: parsed.cashbook.amount,
          counterparty: parsed.cashbook.counterparty,
          notes: parsed.cashbook.notes,
          date: parsed.cashbook.date,
        });
        setActiveModal('cashbook');
      } else if (parsed.intent === 'investment' && parsed.investment) {
        setInvestmentPrefill({
          action: parsed.investment.action,
          asset_type: parsed.investment.asset_type,
          symbol: parsed.investment.symbol,
          quantity: parsed.investment.quantity,
          price: parsed.investment.price,
          date: parsed.investment.date,
          notes: parsed.investment.notes,
        });
        setActiveModal('investment');
      } else {
        // Transaction intent (default)
        const tx = parsed.transaction;
        let matchedCategoryId: string | undefined;

        if (tx?.category && categories?.length) {
          const catLower = tx.category.toLowerCase();
          const found = categories.find((c) =>
            c.name.toLowerCase().includes(catLower) ||
            catLower.includes(c.name.toLowerCase())
          );
          if (found) {
            matchedCategoryId = found.id;
          }
        }

        setTransactionPrefill({
          type: tx?.type ?? 'Expense',
          amount: tx?.amount,
          category_id: matchedCategoryId,
          notes: tx?.notes,
          date: tx?.date,
        });
        setActiveModal('transaction');
      }

      setText('');
    });
  };

  const handleClose = () => {
    setActiveModal(null);
    setTransactionPrefill(null);
    setCashbookPrefill(null);
    setInvestmentPrefill(null);
  };

  const handleFormSuccess = () => {
    handleClose();
    onSuccess?.();
  };

  return (
    <>
      <div
        className={cn(
          'glass-surface rounded-2xl border border-border/80 p-3 sm:p-4 shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20',
          className
        )}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-4 animate-pulse" />
            </div>

            <div className="relative min-w-0 flex-1">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='Type "Spent 30 on coffee today", "Gave 500 to Rahul", "Bought 10 RELIANCE at 2500"...'
                className="h-10 border-0 bg-transparent px-1 text-sm sm:text-base font-normal placeholder:text-muted-foreground/70 focus-visible:ring-0 shadow-none"
              />
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={!text.trim() || isPending}
              className="gap-1.5 rounded-xl font-medium px-3 sm:px-4 shrink-0 transition-transform active:scale-95"
            >
              <span>Add</span>
              <CornerDownLeft className="hidden sm:inline size-3.5 opacity-70" />
              <ArrowRight className="sm:hidden size-3.5" />
            </Button>
          </div>

          {/* Context helper chips showing supported domains */}
          <div className="flex flex-wrap items-center gap-1.5 pl-1 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground/70">Quick Add:</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5">
              <Receipt className="size-3 text-emerald-500" />
              Expenses & Income
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5">
              <Users className="size-3 text-blue-500" />
              Cashbook (Gave / Got)
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5">
              <TrendingUp className="size-3 text-purple-500" />
              Investments (Stocks / SIP)
            </span>
          </div>
        </form>
      </div>

      {/* Pre-filled Modals — never auto-saved; user reviews & confirms */}
      {activeModal === 'transaction' && transactionPrefill && (
        <TransactionForm
          initialValues={transactionPrefill}
          onSuccess={handleFormSuccess}
          onCancel={handleClose}
        />
      )}

      {activeModal === 'cashbook' && cashbookPrefill && (
        <CashbookForm
          initialValues={cashbookPrefill}
          onSuccess={handleFormSuccess}
          onCancel={handleClose}
        />
      )}

      {activeModal === 'investment' && investmentPrefill && (
        <InvestmentForm
          initialValues={investmentPrefill}
          onSuccess={handleFormSuccess}
          onCancel={handleClose}
        />
      )}
    </>
  );
}
