import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import type { Account } from '@repo/shared/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

/**
 * Base UI's <Select.Value> can only show a selected item's label once that item has actually
 * mounted inside the (portalled, closed-by-default) popup — without this `items` map it falls
 * back to rendering the raw value, which is why editing a transaction showed the account's
 * UUID instead of its name until the dropdown had been opened at least once.
 */
function accountItems(accounts: Account[] | undefined): Record<string, string> {
  return Object.fromEntries((accounts ?? []).map((account) => [account.id, `${account.name} (${account.type})`]));
}

interface AccountSelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  accounts: Account[] | undefined;
  placeholder?: string;
}

export function AccountSelectField<T extends FieldValues>({
  control,
  name,
  label,
  accounts,
  placeholder = 'Select account',
}: AccountSelectFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            items={accountItems(accounts)}
            onValueChange={field.onChange}
            value={field.value ?? undefined}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {accounts?.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
