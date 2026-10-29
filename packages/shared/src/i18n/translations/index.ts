import type { Locale } from "../locales";
import { en, type TranslationKey } from "./en";
import { hi } from "./hi";
import { ta } from "./ta";
import { ml } from "./ml";
import { te } from "./te";

export const TRANSLATIONS: Record<Locale, Record<TranslationKey, string>> = { en, hi, ta, ml, te };

export type { TranslationKey };
