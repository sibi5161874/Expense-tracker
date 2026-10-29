'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  DEFAULT_LOCALE,
  TRANSLATIONS,
  isSupportedLocale,
  type Locale,
  type TranslationKey,
} from '@repo/shared/i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LOCALE_STORAGE_KEY = 'preferred-language';

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match));
}

/** Translation values may encode "singular|plural" — picked by `params.count` when present,
 * since Hindi/Tamil/Malayalam/Telugu numeral phrasing doesn't always match English pluralization. */
function resolvePlural(template: string, count: number | undefined): string {
  if (!template.includes('|')) return template;
  const [singular, plural] = template.split('|');
  if (count === undefined) return singular ?? template;
  return count === 1 ? (singular ?? template) : (plural ?? singular ?? template);
}

function translate(locale: Locale, key: TranslationKey, params?: Record<string, string | number>): string {
  const raw = TRANSLATIONS[locale][key] ?? TRANSLATIONS[DEFAULT_LOCALE][key];
  const count = typeof params?.count === 'number' ? params.count : undefined;
  return interpolate(resolvePlural(raw, count), params);
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, params) => translate(DEFAULT_LOCALE, key, params),
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    // localStorage only exists client-side, so restoring the saved preference has to happen in
    // an effect (React's own documented use for one), same pattern as CurrencyProvider. A stored
    // value from the Preferences page's full language list (e.g. 'es') that isn't one of the
    // fully-translated locales here is left at the English default rather than applied.
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isSupportedLocale(stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
      setLocaleState(stored);
    }
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
  }

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        t: (key, params) => translate(locale, key, params),
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useTranslation(): LocaleContextValue {
  return useContext(LocaleContext);
}
