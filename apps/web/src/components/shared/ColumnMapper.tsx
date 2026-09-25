'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMappableFieldsForAssetType } from '@repo/shared/logic';

export interface MappableField {
  key: string;
  label: string;
  required?: boolean;
  hint?: string;
}

interface ColumnMapperProps {
  headers: string[];
  fields?: MappableField[];
  assetType?: string;
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}

const NONE = '__none__';

/**
 * Manual column mapping — the backstop that makes any institution's export
 * importable, including ones with no published schema.
 *
 * Shown whenever automatic detection can't resolve every required field, so the
 * user confirms the interpretation rather than the importer guessing. This is
 * what keeps a wrong guess from silently writing amounts into the wrong field.
 */
export function ColumnMapper({ headers, fields, assetType, value, onChange }: ColumnMapperProps) {
  const activeFields = fields ?? (assetType ? getMappableFieldsForAssetType(assetType) : BROKER_MAPPABLE_FIELDS);

  function setField(key: string, selected: string | null) {
    const next = { ...value };
    if (!selected || selected === NONE) {
      delete next[key];
    } else {
      next[key] = selected;
    }
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Tell us which column in your file holds each value. We&apos;ll show you a preview before anything is
        imported.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {activeFields.map((field) => (
          <div key={field.key}>
            <label className="mb-1.5 block text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </label>
            <Select value={value[field.key] ?? NONE} onValueChange={(v) => setField(field.key, v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {!field.required && <SelectItem value={NONE}>— Not in my file —</SelectItem>}
                {headers.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.hint && <p className="text-muted-foreground mt-1 text-xs">{field.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export const BANK_MAPPABLE_FIELDS: MappableField[] = [
  { key: 'date', label: 'Transaction date', required: true },
  { key: 'description', label: 'Description / narration', required: true },
  { key: 'debit', label: 'Debit / withdrawal', hint: 'Leave empty if your file uses one amount column' },
  { key: 'credit', label: 'Credit / deposit', hint: 'Leave empty if your file uses one amount column' },
  { key: 'amount', label: 'Amount (single column)', hint: 'Only if debit and credit share one column' },
  { key: 'drCrIndicator', label: 'DR/CR indicator', hint: 'The column marking money in vs out' },
  { key: 'balance', label: 'Running balance', hint: 'Optional — lets us self-check the import against your file' },
];

export const BROKER_MAPPABLE_FIELDS: MappableField[] = [
  { key: 'date', label: 'Trade date', required: true },
  { key: 'symbol', label: 'Symbol / scheme name', required: true },
  { key: 'tradeType', label: 'Buy or sell', required: true },
  { key: 'quantity', label: 'Quantity / units', required: true },
  { key: 'price', label: 'Price / NAV', required: true },
  { key: 'exchange', label: 'Exchange', hint: 'Optional — defaults to NSE' },
];
