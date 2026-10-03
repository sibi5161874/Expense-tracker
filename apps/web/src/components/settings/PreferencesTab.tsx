'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useCurrency } from '@/contexts/CurrencyContext';
import { POPULAR_CURRENCIES } from '@repo/shared/utils/currency';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: '🇪🇸 Spanish' },
  { value: 'zh-Hans', label: '🇨🇳 Simplified Chinese' },
  { value: 'hi', label: '🇮🇳 Hindi' },
  { value: 'ar', label: '🇸🇦 Arabic' },
  { value: 'fr', label: '🇫🇷 French' },
  { value: 'pt-BR', label: '🇧🇷 Portuguese (Brazil)' },
  { value: 'ru', label: '🇷🇺 Russian' },
  { value: 'ja', label: '🇯🇵 Japanese' },
  { value: 'de', label: '🇩🇪 German' },
];

const LANGUAGE_STORAGE_KEY = 'preferred-language';

export function PreferencesTab() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState('en');
  const { currency, setCurrency } = useCurrency();
  const { data: profile, saveProfile, isSaving: isSavingReportEmail } = useUserProfile();
  const { hasFeature } = useEntitlements();
  const canReceiveReportEmail = hasFeature('reportExport');
  const reportEmailEnabled = profile?.monthly_report_email_enabled ?? false;

  async function handleReportEmailToggle(checked: boolean) {
    try {
      await saveProfile({ monthly_report_email_enabled: checked });
      toast.success(
        checked
          ? "You'll get your Overall Report by email on the 1st of every month."
          : 'Monthly report emails turned off.'
      );
    } catch {
      toast.error('Could not update this setting — please try again.');
    }
  }

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) setLanguage(stored);
  }, []);

  function handleLanguageChange(value: string | null) {
    if (!value) return;
    setLanguage(value);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
    const matched = LANGUAGES.find((l) => l.value === value);
    toast.success(`Language preference set to ${matched?.label ?? value}.`);
  }

  function handleCurrencyChange(value: string | null) {
    if (!value) return;
    setCurrency(value);
    const matched = POPULAR_CURRENCIES.find((c) => c.code === value);
    toast.success(`Default currency set to ${matched?.name ?? value}.`);
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
              Loading...
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
          Choose your preferred language. Only English is fully translated today — other
          languages are saved as a preference for when translations ship.
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
                  {lang.label}
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
              <p className="text-muted-foreground text-xs">Requires Pro — same as PDF report export.</p>
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
