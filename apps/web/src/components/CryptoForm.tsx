'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assetCryptoSchema, type AssetCryptoInput } from '@repo/shared/schemas';
import { parseSupabaseError } from '@repo/shared/utils';
import { useCryptoAssets } from '@/hooks/useAssets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface CryptoFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editing?: { id: string } & AssetCryptoInput;
}

export function CryptoForm({ onSuccess, onCancel, editing }: CryptoFormProps) {
  const { create: createCrypto, update: updateCrypto } = useCryptoAssets();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<AssetCryptoInput>({
    resolver: zodResolver(assetCryptoSchema),
    defaultValues: editing ?? {
      symbol: '',
      name: '',
      quantity: 0,
      buy_price: 0,
      current_price: 0,
      wallet_or_exchange: '',
      purchase_date: new Date().toISOString().slice(0, 10),
      notes: '',
    },
  });

  async function onSubmit(data: AssetCryptoInput) {
    setFormError(null);
    try {
      if (editing) {
        await updateCrypto({ id: editing.id, data });
      } else {
        await createCrypto(data);
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
          <DialogTitle>{editing ? 'Edit Crypto Asset' : 'Add Crypto Asset'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <DialogBody>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbol</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. BTC, ETH, SOL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coin Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Bitcoin" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00000000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="buy_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buy Price (per coin, ₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="current_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Price (per coin, ₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="wallet_or_exchange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet / Exchange (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Binance, Ledger" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchase_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Notes..." {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {formError && <p className="text-destructive text-sm">{formError}</p>}
            </DialogBody>

            <DialogFooter className="sm:justify-stretch">
              <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : editing ? 'Save Changes' : 'Save Crypto'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
