import type { Control } from 'react-hook-form';
import type { InvestmentLogInput } from '@repo/shared/schemas';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface InvestmentActionFieldsProps {
  control: Control<InvestmentLogInput>;
  action: InvestmentLogInput['action'];
  /** Mutual funds are bought in units at a NAV, not shares at a price. */
  assetType?: InvestmentLogInput['asset_type'];
}

/** Quantity/price/dividend/bonus/fees fields — which ones show depends on the selected action. */
export function InvestmentActionFields({ control, action, assetType }: InvestmentActionFieldsProps) {
  const isFund = assetType === 'Mutual Fund';
  return (
    <>
      {action !== 'DIVIDEND' && action !== 'BONUS' && action !== 'SPLIT' && (
        <>
          <FormField
            control={control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isFund ? 'Units' : 'Quantity'}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0"
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
            control={control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isFund ? 'NAV (price per unit)' : 'Price'}</FormLabel>
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
        </>
      )}

      {action === 'DIVIDEND' && (
        <FormField
          control={control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dividend Amount</FormLabel>
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
      )}

      {(action === 'BONUS' || action === 'SPLIT') && (
        <FormField
          control={control}
          name="bonus_split_extra_units"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Extra Units</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {action !== 'BONUS' && action !== 'SPLIT' && (
        <FormField
          control={control}
          name="fees"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fees</FormLabel>
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
      )}
    </>
  );
}
