'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { investmentLogSchema, type InvestmentLogInput } from '@repo/shared/schemas';
import { parseSupabaseError } from '@repo/shared/utils';
import { useAccounts } from '@/hooks/useAccounts';
import { useInvestmentLog } from '@/hooks/useInvestmentLog';
import { useRefreshPrices } from '@/hooks/useRefreshPrices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AccountSelectField } from '@/components/shared/form-fields/AccountSelectField';
import { NotesField } from '@/components/shared/form-fields/NotesField';
import { InvestmentActionFields } from '@/components/investments/InvestmentActionFields';
import { MutualFundPicker } from '@/components/investments/MutualFundPicker';

type AssetType = InvestmentLogInput['asset_type'];

/** Funds are priced from AMFI and crypto from a USD pair, so neither has an exchange to ask
 * about — these values just satisfy the (required) exchange column and say where the price comes from. */
const AUTO_EXCHANGE: Partial<Record<AssetType, string>> = { 'Mutual Fund': 'AMFI', Crypto: 'CRYPTO' };

interface InvestmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editing?: { id: string } & InvestmentLogInput;
}

export function InvestmentForm({ onSuccess, onCancel, editing }: InvestmentFormProps) {
  const { data: accounts } = useAccounts(true);
  const { createInvestmentLog, updateInvestmentLog } = useInvestmentLog();
  const { refresh } = useRefreshPrices();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<InvestmentLogInput>({
    resolver: zodResolver(investmentLogSchema),
    defaultValues: editing ?? {
      action: 'BUY',
      asset_type: 'Stock',
      date: new Date().toISOString().split('T')[0],
      fees: 0,
    },
  });

  const action = form.watch('action');
  const assetType = form.watch('asset_type');
  const symbol = form.watch('symbol');
  const isFund = assetType === 'Mutual Fund';
  const isCrypto = assetType === 'Crypto';

  function handleAssetTypeChange(next: AssetType) {
    const prev = form.getValues('asset_type');
    form.setValue('asset_type', next);
    if (next === prev) return;

    // A fund's symbol is an AMFI scheme code and everything else's is a ticker — neither is valid
    // as the other, so switching across that line clears it rather than leaving a wrong value.
    if (next === 'Mutual Fund' || prev === 'Mutual Fund') form.setValue('symbol', '');

    const auto = AUTO_EXCHANGE[next];
    const currentExchange = form.getValues('exchange');
    if (auto) form.setValue('exchange', auto);
    else if (currentExchange === 'AMFI' || currentExchange === 'CRYPTO') form.setValue('exchange', '');
  }

  async function onSubmit(data: InvestmentLogInput) {
    setFormError(null);
    try {
      if (editing) {
        await updateInvestmentLog({ id: editing.id, data });
      } else {
        await createInvestmentLog(data);
        // A fund's name and NAV come from the price refresh, so fetch them now rather than leaving
        // the new holding showing a bare scheme code until the next automatic refresh.
        if (data.asset_type === 'Mutual Fund') refresh().catch(() => undefined);
      }
      onSuccess();
    } catch (error) {
      setFormError(parseSupabaseError(error as Error));
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Investment' : 'Add Investment'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <DialogBody>
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <DatePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="asset_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Type</FormLabel>
                  <Select onValueChange={(v) => handleAssetTypeChange(v as AssetType)} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Stock">Stock</SelectItem>
                      <SelectItem value="ETF">ETF</SelectItem>
                      <SelectItem value="Mutual Fund">Mutual Fund</SelectItem>
                      <SelectItem value="Crypto">Crypto</SelectItem>
                      <SelectItem value="Bond">Bond</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isFund ? 'Fund' : 'Symbol'}</FormLabel>
                  <FormControl>
                    {isFund ? (
                      <MutualFundPicker
                        value={symbol ?? ''}
                        onSelect={(scheme) => {
                          form.setValue('symbol', scheme.schemeCode, { shouldValidate: true });
                          form.setValue('exchange', 'AMFI');
                        }}
                        onClear={() => form.setValue('symbol', '')}
                      />
                    ) : (
                      <Input placeholder={isCrypto ? 'e.g., BTC, ETH' : 'e.g., RELIANCE, HDFCBANK'} {...field} />
                    )}
                  </FormControl>
                  {isCrypto && (
                    <p className="text-muted-foreground text-xs">
                      Priced in US dollars from the matching USD pair (BTC becomes BTC-USD).
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isFund && !isCrypto && (
              <FormField
                control={form.control}
                name="exchange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exchange</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., NSE, BSE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BUY">BUY</SelectItem>
                      <SelectItem value="SELL">SELL</SelectItem>
                      <SelectItem value="SIP">SIP</SelectItem>
                      <SelectItem value="DIVIDEND">DIVIDEND</SelectItem>
                      <SelectItem value="BONUS">BONUS</SelectItem>
                      <SelectItem value="SPLIT">SPLIT</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <InvestmentActionFields control={form.control} action={action} assetType={assetType} />

            <AccountSelectField
              control={form.control}
              name="linked_account_id"
              label="Linked Account"
              accounts={accounts}
            />

            <NotesField control={form.control} name="notes" />

            {formError && <p className="text-destructive text-sm">{formError}</p>}

            </DialogBody>

            <DialogFooter className="sm:justify-stretch">
              <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : editing ? 'Save Changes' : 'Save Investment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
