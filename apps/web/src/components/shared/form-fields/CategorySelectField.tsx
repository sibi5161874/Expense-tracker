import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import type { Category } from '@repo/shared/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

/**
 * Base UI's <Select.Value> can only show a selected item's label once that item has actually
 * mounted inside the (portalled, closed-by-default) popup — without this `items` map it falls
 * back to rendering the raw value, which is why editing a transaction showed the category's
 * UUID instead of its name until the dropdown had been opened at least once.
 */
function categoryItems(categories: Category[] | undefined): Record<string, string> {
  return Object.fromEntries((categories ?? []).map((cat) => [cat.id, cat.name]));
}

interface CategorySelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  categories: Category[] | undefined;
}

export function CategorySelectField<T extends FieldValues>({
  control,
  name,
  categories,
}: CategorySelectFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Category</FormLabel>
          <Select
            items={categoryItems(categories)}
            onValueChange={field.onChange}
            value={field.value ?? undefined}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
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
