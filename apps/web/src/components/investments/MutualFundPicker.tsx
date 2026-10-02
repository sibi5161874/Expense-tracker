'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { formatINR } from '@repo/shared/utils';
import type { AmfiSchemeMatch } from '@repo/shared/logic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MutualFundPickerProps {
  /** AMFI scheme code currently stored as the symbol ('' until a fund is picked). */
  value: string;
  onSelect: (scheme: AmfiSchemeMatch) => void;
  onClear: () => void;
}

async function searchSchemes(q: string, signal: AbortSignal): Promise<AmfiSchemeMatch[]> {
  const res = await fetch(`/api/mf/search?q=${encodeURIComponent(q)}`, { signal });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Couldn't search funds right now.");
  return data.results as AmfiSchemeMatch[];
}

function describe(scheme: AmfiSchemeMatch): string {
  return [scheme.plan, scheme.option].filter(Boolean).join(' · ');
}

/**
 * Picks a mutual fund from AMFI's list instead of free-typing a symbol. The form stores the
 * picked scheme's code as the symbol, which is what the price refresh matches exactly — a typed
 * name like "AXIS_BLUECHIP_FUND" matches nothing and silently never gets a NAV.
 */
export function MutualFundPicker({ value, onSelect, onClear }: MutualFundPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AmfiSchemeMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AmfiSchemeMatch | null>(null);

  // Typing: debounced search. All state changes happen inside the timer/async callbacks.
  useEffect(() => {
    if (value) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (query.trim().length < 3) {
        setResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      try {
        const found = await searchSchemes(query, controller.signal);
        setResults(found);
        setError(null);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Search failed');
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, value]);

  // Editing a saved fund: only its scheme code is stored, so recover the name by looking the code up.
  useEffect(() => {
    if (!value || selected?.schemeCode === value) return;
    const controller = new AbortController();
    searchSchemes(value, controller.signal)
      .then((found) => {
        const match = found.find((s) => s.schemeCode === value);
        if (match) setSelected(match);
      })
      .catch(() => {
        // The code alone is still shown below — a failed name lookup isn't worth an error.
      });
    return () => controller.abort();
  }, [value, selected?.schemeCode]);

  if (value) {
    const shown = selected?.schemeCode === value ? selected : null;
    return (
      <div className="bg-muted/50 flex items-start justify-between gap-3 rounded-xl border p-3">
        <div className="min-w-0 text-sm">
          <p className="font-medium">{shown?.name ?? `Scheme code ${value}`}</p>
          <p className="text-muted-foreground text-xs">
            {shown && describe(shown) ? `${describe(shown)} · ` : ''}code {value}
            {shown ? ` · NAV ${formatINR(shown.nav)} (${shown.date})` : ''}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelected(null);
            setQuery('');
            setResults([]);
            onClear();
          }}
        >
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a fund, e.g. Parag Parikh Flexi Cap"
          className="pl-9"
          autoComplete="off"
        />
      </div>

      {error && <p className="text-destructive text-xs">{error}</p>}
      {searching && <p className="text-muted-foreground text-xs">Searching…</p>}
      {!searching && query.trim().length >= 3 && results.length === 0 && !error && (
        <p className="text-muted-foreground text-xs">No funds found — try fewer or different words.</p>
      )}

      {results.length > 0 && (
        <ul className="max-h-56 divide-y overflow-y-auto rounded-xl border">
          {results.map((scheme) => (
            <li key={scheme.schemeCode}>
              <button
                type="button"
                className="hover:bg-accent w-full px-3 py-2 text-left text-sm transition-colors"
                onClick={() => {
                  setSelected(scheme);
                  onSelect(scheme);
                }}
              >
                <span className="block truncate font-medium">{scheme.name}</span>
                <span className="text-muted-foreground block text-xs">
                  {describe(scheme)} · NAV {formatINR(scheme.nav)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
