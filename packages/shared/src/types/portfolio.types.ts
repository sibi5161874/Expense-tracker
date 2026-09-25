import type { SymbolHolding } from '../logic/investment';

export type SortKey = 'currentValue_desc' | 'returnPct_desc' | 'returnPct_asc' | 'invested_desc';

export type FilterType = 'all' | 'profit' | 'loss';

export interface FilterState {
  assetType?: string;
  filter?: FilterType;
  sortBy?: SortKey;
  searchQuery?: string;
}

export interface HoldingSegment {
  assetType: string;
  holdings: SymbolHolding[];
  totalInvested: number;
  totalCurrent: number;
  totalPnl: number;
  avgReturnPct: number;
}
