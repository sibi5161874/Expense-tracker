import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface MarketHeatmapItem {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  size: number;
}

export interface MarketHeatmapResponse {
  data: MarketHeatmapItem[];
  updatedAt: string;
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function useMarketHeatmap() {
  const { session } = useAuth();
  const webAppUrl = process.env.EXPO_PUBLIC_WEB_APP_URL ?? 'http://localhost:3000';

  return useQuery<MarketHeatmapResponse>({
    queryKey: ['market-heatmap'],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`${webAppUrl}/api/market/heatmap`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to fetch market heatmap: HTTP ${res.status}`);
      }
      return res.json();
    },
    staleTime: FIVE_MINUTES_MS,
  });
}
