'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslation } from '@/contexts/LocaleContext';
import { POPULAR_CURRENCIES } from '@repo/shared/utils/currency';
import { LOCALE_LABELS, isSupportedLocale } from '@repo/shared/i18n';

// Every language a user can pick as a preference; only LOCALE_LABELS' keys (English + the 4
// `live: true` entries below) are actually wired to translated UI text today — the rest just
// persist the choice for when translations ship. Live ones are listed first so they're never
// buried under a long "coming soon" tail.
const LANGUAGES = [
  { value: 'en', label: LOCALE_LABELS.en, live: true },
  { value: 'hi', label: LOCALE_LABELS.hi, live: true },
  { value: 'ta', label: LOCALE_LABELS.ta, live: true },
  { value: 'ml', label: LOCALE_LABELS.ml, live: true },
  { value: 'te', label: LOCALE_LABELS.te, live: true },
  { value: 'es', label: 'Spanish', live: false },
  { value: 'zh-Hans', label: 'Simplified Chinese', live: false },
  { value: 'ar', label: 'Arabic', live: false },
  { value: 'fr', label: 'French', live: false },
  { value: 'pt-BR', label: 'Portuguese (Brazil)', live: false },
  { value: 'ru', label: 'Russian', live: false },
  { value: 'ja', label: 'Japanese', live: false },
  { value: 'de', label: 'German', live: false },
];

const LANGUAGE_STORAGE_KEY = 'preferred-language';

export function PreferencesTab() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState('en');
  const { currency, setCurrency } = useCurrency();
  const { setLocale, t } = useTranslation();
  const { data: profile, saveProfile, isSaving: isSavingReportEmail } = useUserProfile();
  const { hasFeature } = useEntitlements();
  const canReceiveReportEmail = hasFeature('reportExport');
  const reportEmailEnabled = profile?.monthly_report_email_enabled ?? false;

  async function handleReportEmailToggle(checked: boolean) {
    try {
      await saveProfile({ monthly_report_email_enabled: checked });
      toast.success(checked ? t('toast.settings.reportEmailOn') : t('toast.settings.reportEmailOff'));
    } catch {
      toast.error(t('toast.settings.updateFailed'));
    }
  }

  useEffect(() => {
    // Mount flag (SSR safety) and localStorage read (client-only) both have to happen in an
    // effect — React's own documented use for one — rather than during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
    setMounted(true);
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) setLanguage(stored);
  }, []);

  function handleLanguageChange(value: string | null) {
    if (!value) return;
    setLanguage(value);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
    // Only actually switches the app's translated UI for the locales that are really live;
    // other picks still persist above (for when translations ship) without touching `t()`.
    if (isSupportedLocale(value)) setLocale(value);
    const matched = LANGUAGES.find((l) => l.value === value);
    toast.success(t('toast.settings.languageSet', { language: matched?.label ?? value }));
  }

  function handleCurrencyChange(value: string | null) {
    if (!value) return;
    setCurrency(value);
    const matched = POPULAR_CURRENCIES.find((c) => c.code === value);
    toast.success(t('toast.settings.currencySet', { currency: matched?.name ?? value }));
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <p className="text-muted-foreground mt-1 mb-4 text-sm">Switch between light and dark mode.</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Dark Mode</span>
          {mounted ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? (
                <>
                  <Sun className="size-4" />
                  Switch to Light
                </>
              ) : (
                <>
                  <Moon className="size-4" />
                  Switch to Dark
                </>
              )}
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Loading…
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Currency & Number Formatting</h2>
        <p className="text-muted-foreground mt-1 mb-4 text-sm">
          Choose your default reporting currency and symbol for amounts, totals, and input fields.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Base Currency</span>
          <Select value={currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select currency">
                {POPULAR_CURRENCIES.find((c) => c.code === currency)?.name ?? currency}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {POPULAR_CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <span className="font-mono font-semibold mr-2">{c.symbol}</span>
                  <span>{c.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Language</h2>
        <p className="text-muted-foreground mt-1 mb-4 text-sm">
          Choose your preferred language. English, Hindi, Tamil, Malayalam, and Telugu are
          translated for navigation, confirmations, and common actions today — the rest are
          saved as a preference for when translations ship.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Language</span>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select language">
                {LANGUAGES.find((l) => l.value === language)?.label ?? 'English'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  <span className="flex w-full items-center justify-between gap-2">
                    <span>{lang.label}</span>
                    {!lang.live && (
                      <StatusBadge tone="neutral" className="shrink-0">
                        Coming soon
                      </StatusBadge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Email Reports</h2>
        <p className="text-muted-foreground mt-1 mb-4 text-sm">
          Get your Overall Report emailed to you automatically at 6:00 AM IST on the 1st of every
          month. Off by default.
        </p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-sm font-medium">Monthly Overall Report</span>
            {!canReceiveReportEmail && (
              <p className="text-muted-foreground text-xs">Requires Pro, same as PDF report export.</p>
            )}
          </div>
          {canReceiveReportEmail ? (
            <Switch
              checked={reportEmailEnabled}
              onCheckedChange={handleReportEmailToggle}
              disabled={isSavingReportEmail}
            />
          ) : (
            <Button variant="outline" size="sm" onClick={() => router.push('/settings?tab=billing')}>
              Upgrade to Pro
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
