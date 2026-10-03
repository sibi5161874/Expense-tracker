'use client';

import * as React from 'react';
import { Input } from './input';
import { useCurrency } from '@/contexts/CurrencyContext';

export interface AmountInputProps extends React.ComponentProps<typeof Input> {
  currencySymbol?: string;
}

export const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  ({ currencySymbol, prefix, placeholder = '0.00', step = '0.01', type = 'number', ...props }, ref) => {
    const { symbol } = useCurrency();
    const resolvedPrefix = prefix ?? currencySymbol ?? symbol;

    return (
      <Input
        ref={ref}
        type={type}
        step={step}
        placeholder={placeholder}
        prefix={resolvedPrefix}
        {...props}
      />
    );
  }
);

AmountInput.displayName = 'AmountInput';
