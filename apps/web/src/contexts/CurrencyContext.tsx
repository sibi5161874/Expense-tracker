'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { POPULAR_CURRENCIES, formatCurrency, type CurrencyOption } from '@repo/shared/utils/currency';
import { getCurrencySymbol } from '@repo/shared/logic/fx';

interface CurrencyContextValue {
  currency: string;
  symbol: string;
  currencyOption: CurrencyOption;
  setCurrency: (code: string) => void;
  format: (amount: number) => string;
}

const CURRENCY_STORAGE_KEY = 'preferred-currency';
const DEFAULT_CURRENCY = 'INR';

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  symbol: '₹',
  currencyOption: POPULAR_CURRENCIES[0]!,
  setCurrency: () => {},
  format: (amount) => formatCurrency(amount, DEFAULT_CURRENCY),
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(DEFAULT_CURRENCY);

  useEffect(() => {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (saved) {
      setCurrencyState(saved.toUpperCase());
    }
  }, []);

  function setCurrency(code: string) {
    const upper = code.toUpperCase();
    setCurrencyState(upper);
    localStorage.setItem(CURRENCY_STORAGE_KEY, upper);
  }

  const symbol = getCurrencySymbol(currency);
  const currencyOption = POPULAR_CURRENCIES.find((c) => c.code === currency) ?? POPULAR_CURRENCIES[0]!;

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        symbol,
        currencyOption,
        setCurrency,
        format: (amount: number) => formatCurrency(amount, currency),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}
