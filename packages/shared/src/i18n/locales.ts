export const SUPPORTED_LOCALES = ["en", "hi", "ta", "ml", "te"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  ml: "Malayalam",
  te: "Telugu",
};

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
