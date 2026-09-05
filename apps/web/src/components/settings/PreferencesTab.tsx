'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState('en');

  // Whether resolvedTheme is defined yet on the client's first render depends on the
  // installed next-themes version's internal timing — in this project it's already defined
  // by then, which doesn't match the server's render and causes a hydration mismatch. An
  // explicit mounted flag is guaranteed false on both the server and the client's first pass
  // regardless of any hook's internals, so it's the only version-safe way to gate this.
  //
  // localStorage also only exists client-side, so reading the saved language preference has
  // to happen here too (React's own documented use for an effect — synchronizing with an
  // external system) rather than during render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
    setMounted(true);
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) setLanguage(stored);
  }, []);

  function handleLanguageChange(value: string | null) {
    if (!value) return;
    setLanguage(value);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
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
        <h2 className="text-sm font-semibold">Language</h2>
        <p className="text-muted-foreground mt-1 mb-4 text-sm">
          Choose your preferred language. Only English is fully translated today — other
          languages are saved as a preference for when translations ship.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Language</span>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-56">
              <SelectValue />
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
    </div>
  );
}
