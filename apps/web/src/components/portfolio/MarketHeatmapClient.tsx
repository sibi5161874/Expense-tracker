'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useTransition, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HeatmapData } from './MarketHeatmap';

export type HeatmapIndex = 'nifty50' | 'nifty500' | 'sp500';

const MarketHeatmap = dynamic(
  () => import('./MarketHeatmap').then((mod) => mod.MarketHeatmap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[640px] w-full rounded-xl border border-zinc-800 bg-[#0c0d10] p-6 flex flex-col items-center justify-center gap-3">
        <div className="size-8 rounded-full border-2 border-zinc-600 border-t-emerald-500 animate-spin" />
        <span className="text-xs font-mono text-zinc-400">Loading Market Heatmap...</span>
      </div>
    ),
  }
);

export function MarketHeatmapClient() {
  const [currentIndex, setCurrentIndex] = useState<HeatmapIndex>('nifty50');
  const [data, setData] = useState<HeatmapData[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Client-side cache for instant zero-latency index switching
  const [cache, setCache] = useState<
    Partial<Record<HeatmapIndex, { data: HeatmapData[]; currencySymbol: string }>>
  >({});

  const fetchIndexData = useCallback(
    async (idx: HeatmapIndex, forceRefresh = false) => {
      if (!forceRefresh && cache[idx]) {
        const cachedItem = cache[idx]!;
        setData(cachedItem.data);
        setCurrencySymbol(cachedItem.currencySymbol);
        setCurrentIndex(idx);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/market/heatmap?index=${idx}`);
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const json = await res.json();
        const incomingData: HeatmapData[] = json.data ?? [];
        const incomingCurrency =
          json.currencySymbol || (idx === 'sp500' ? '$' : '₹');

        startTransition(() => {
          setData(incomingData);
          setCurrencySymbol(incomingCurrency);
          setCurrentIndex(idx);
          setLoading(false);
          setCache((prev) => ({
            ...prev,
            [idx]: { data: incomingData, currencySymbol: incomingCurrency },
          }));
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch market data');
        setLoading(false);
      }
    },
    [cache]
  );

  useEffect(() => {
    let ignore = false;

    async function loadInitial() {
      try {
        const res = await fetch('/api/market/heatmap?index=nifty50');
        if (!res.ok) throw new Error('Failed to load market data');
        const json = await res.json();
        if (!ignore && json.data?.length) {
          setData(json.data);
          setCurrencySymbol(json.currencySymbol || '₹');
          setCache((prev) => ({
            ...prev,
            nifty50: { data: json.data, currencySymbol: json.currencySymbol || '₹' },
          }));
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to fetch market data');
          setLoading(false);
        }
      }
    }

    void loadInitial();

    // Pre-fetch S&P 500 in background after 2 seconds for instantaneous tab switches
    const timer = setTimeout(() => {
      fetch('/api/market/heatmap?index=sp500')
        .then((res) => res.json())
        .then((json) => {
          if (!ignore && json.data?.length) {
            setCache((prev) => ({
              ...prev,
              sp500: {
                data: json.data,
                currencySymbol: json.currencySymbol || '$',
              },
            }));
          }
        })
        .catch(() => {});
    }, 2000);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, []);

  const handleIndexChange = (newIndex: HeatmapIndex) => {
    if (newIndex === currentIndex) return;
    fetchIndexData(newIndex);
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchIndexData(currentIndex, true).finally(() => {
      setIsRefreshing(false);
    });
  }, [currentIndex, fetchIndexData]);

  if (loading && data.length === 0) {
    return (
      <div className="h-[640px] w-full rounded-xl border border-zinc-800 bg-[#0c0d10] p-6 flex flex-col items-center justify-center gap-3">
        <div className="size-8 rounded-full border-2 border-zinc-600 border-t-emerald-500 animate-spin" />
        <span className="text-xs font-mono text-zinc-400">Loading Market Heatmap...</span>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            setCurrentIndex((prev) => prev);
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <MarketHeatmap
        data={data}
        currentIndex={currentIndex}
        currencySymbol={currencySymbol}
        onIndexChange={handleIndexChange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        isLoadingIndex={loading}
      />
    </div>
  );
}
