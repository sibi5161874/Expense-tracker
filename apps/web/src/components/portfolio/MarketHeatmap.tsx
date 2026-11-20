'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Search,
  RotateCcw,
  Layers,
  BarChart3,
  SlidersHorizontal,
  ArrowUpDown,
  RefreshCw,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HeatmapIndex } from './MarketHeatmapClient';

export interface HeatmapData {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  size: number;
  [key: string]: unknown;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LayoutItem<T> {
  item: T;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type SizeMetric = 'marketCap' | 'equalWeight';
export type ColorMetric = 'change1D' | 'gainersOnly' | 'losersOnly';
export type SortOption = 'capDesc' | 'perfDesc' | 'perfAsc' | 'symbolAsc';

export interface MarketHeatmapProps {
  data: HeatmapData[];
  currentIndex?: HeatmapIndex;
  currencySymbol?: string;
  onIndexChange?: (newIndex: HeatmapIndex) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoadingIndex?: boolean;
}

/**
 * Standard Squarified Treemap Layout (Bruls, Huizing, van Wijk).
 * Generates tiles with aspect ratios closest to 1:1, matching TradingView.
 */
function squarify<T extends { value: number }>(items: T[], rect: Rect): LayoutItem<T>[] {
  if (!items || items.length === 0 || rect.w <= 0 || rect.h <= 0) return [];
  const total = items.reduce((s, it) => s + Math.max(it.value, 0.001), 0);
  if (total <= 0) return [];

  const sorted = [...items].sort((a, b) => b.value - a.value);
  const elements = sorted.map((it) => ({
    ...it,
    area: (Math.max(it.value, 0.001) / total) * (rect.w * rect.h),
  }));

  const result: LayoutItem<T>[] = [];

  function layoutRow(row: typeof elements, curRect: Rect) {
    if (row.length === 0) return;
    const rowArea = row.reduce((s, it) => s + it.area, 0);
    const isHoriz = curRect.w >= curRect.h;
    const rowWidth = isHoriz ? rowArea / curRect.h : curRect.w;
    const rowHeight = isHoriz ? curRect.h : rowArea / curRect.w;

    let offset = 0;
    for (const it of row) {
      if (isHoriz) {
        const h = it.area / rowWidth;
        result.push({
          item: it,
          x: curRect.x,
          y: curRect.y + offset,
          w: rowWidth,
          h,
        });
        offset += h;
      } else {
        const w = it.area / rowHeight;
        result.push({
          item: it,
          x: curRect.x + offset,
          y: curRect.y,
          w,
          h: rowHeight,
        });
        offset += w;
      }
    }
  }

  function worstRatio(row: typeof elements, length: number) {
    if (row.length === 0) return Infinity;
    const rowArea = row.reduce((s, it) => s + it.area, 0);
    const side = rowArea / length;
    let worst = 0;
    for (const it of row) {
      const other = it.area / side;
      const ratio = Math.max(side / other, other / side);
      if (ratio > worst) worst = ratio;
    }
    return worst;
  }

  let curRect = { ...rect };
  let currentRow: typeof elements = [];

  for (let i = 0; i < elements.length; i++) {
    const it = elements[i]!;
    const isHoriz = curRect.w >= curRect.h;
    const length = isHoriz ? curRect.h : curRect.w;

    const candRow = [...currentRow, it];
    if (currentRow.length === 0 || worstRatio(candRow, length) <= worstRatio(currentRow, length)) {
      currentRow = candRow;
    } else {
      layoutRow(currentRow, curRect);
      const rowArea = currentRow.reduce((s, item) => s + item.area, 0);
      if (isHoriz) {
        const rowWidth = rowArea / curRect.h;
        curRect = {
          x: curRect.x + rowWidth,
          y: curRect.y,
          w: Math.max(0, curRect.w - rowWidth),
          h: curRect.h,
        };
      } else {
        const rowHeight = rowArea / curRect.w;
        curRect = {
          x: curRect.x,
          y: curRect.y + rowHeight,
          w: curRect.w,
          h: Math.max(0, curRect.h - rowHeight),
        };
      }
      currentRow = [it];
    }
  }

  if (currentRow.length > 0) {
    layoutRow(currentRow, curRect);
  }

  return result;
}

/**
 * Exact TradingView Stock Heatmap Color Scale (as seen in Image 1)
 */
function getTradingViewColor(change: number, metric: ColorMetric = 'change1D'): string {
  if (metric === 'gainersOnly') {
    if (change <= 0) return '#181b22'; // dimmed neutral
    if (change >= 3) return '#00b050';
    if (change >= 1.5) return '#168a48';
    return '#154228';
  }

  if (metric === 'losersOnly') {
    if (change >= 0) return '#181b22'; // dimmed neutral
    if (change <= -3) return '#c51f26';
    if (change <= -1.5) return '#a82329';
    return '#4a181d';
  }

  if (change >= 3) return '#00b050'; // bright vibrant green
  if (change >= 1.5) return '#168a48'; // solid emerald green
  if (change >= 0) return '#154228'; // dark muted green
  if (change >= -1.5) return '#4a181d'; // dark muted maroon
  if (change >= -3) return '#a82329'; // solid crimson red
  return '#c51f26'; // strong ruby red
}

const INDEX_CONFIG: Record<
  HeatmapIndex,
  { label: string; fullTitle: string; flag: string; description: string }
> = {
  nifty50: {
    label: 'Nifty 50 Index',
    fullTitle: 'Nifty 50 Market Heatmap',
    flag: '🇮🇳',
    description: 'Top 50 Indian Mega-Cap Leaders',
  },
  nifty500: {
    label: 'Nifty 500 Broad',
    fullTitle: 'Nifty 500 Market Heatmap',
    flag: '🇮🇳',
    description: 'Broad Indian Market & Mid-Caps',
  },
  sp500: {
    label: 'S&P 500 Index',
    fullTitle: 'S&P 500 Market Heatmap',
    flag: '🇺🇸',
    description: 'Top US Mega-Caps (Tech, Finance, Health)',
  },
};

const STOCK_DOMAINS: Record<string, string> = {
  // US Mega Caps
  AAPL: 'apple.com',
  NVDA: 'nvidia.com',
  MSFT: 'microsoft.com',
  GOOGL: 'google.com',
  GOOG: 'google.com',
  AMZN: 'amazon.com',
  META: 'meta.com',
  TSLA: 'tesla.com',
  'BRK-B': 'berkshirehathaway.com',
  AVGO: 'broadcom.com',
  JPM: 'jpmorganchase.com',
  V: 'visa.com',
  MA: 'mastercard.com',
  WMT: 'walmart.com',
  LLY: 'lilly.com',
  UNH: 'unitedhealthgroup.com',
  XOM: 'exxonmobil.com',
  COST: 'costco.com',
  HD: 'homedepot.com',
  AMD: 'amd.com',
  QCOM: 'qualcomm.com',
  TXN: 'ti.com',
  INTC: 'intel.com',
  MU: 'micron.com',
  AMAT: 'appliedmaterials.com',
  ORCL: 'oracle.com',
  CRM: 'salesforce.com',
  ADBE: 'adobe.com',
  CSCO: 'cisco.com',
  BAC: 'bankofamerica.com',
  PG: 'pg.com',
  JNJ: 'jnj.com',
  NFLX: 'netflix.com',
  DIS: 'thewaltdisneycompany.com',
  CAT: 'caterpillar.com',
  GE: 'geaerospace.com',
  ABBV: 'abbvie.com',
  MRK: 'merck.com',
  TMO: 'thermofisher.com',
  ABT: 'abbott.com',
  PFE: 'pfizer.com',
  KO: 'coca-cola.com',
  PEP: 'pepsico.com',
  PM: 'pmi.com',
  CVX: 'chevron.com',
  COP: 'conocophillips.com',
  HON: 'honeywell.com',
  BA: 'boeing.com',
  RTX: 'rtx.com',
  NEE: 'nexteraenergy.com',
  SO: 'southerncompany.com',
  CMCSA: 'comcastcorporation.com',
  VZ: 'verizon.com',
  T: 'att.com',
  WFC: 'wellsfargo.com',
  MS: 'morganstanley.com',
  GS: 'goldmansachs.com',
  BLK: 'blackrock.com',
  GM: 'gm.com',
  F: 'ford.com',
  LOW: 'lowes.com',
  TGT: 'target.com',

  // Indian Large & Mid Caps
  RELIANCE: 'ril.com',
  TCS: 'tcs.com',
  HDFCBANK: 'hdfcbank.com',
  ICICIBANK: 'icicibank.com',
  BHARTIARTL: 'airtel.in',
  INFY: 'infosys.com',
  SBIN: 'sbi.co.in',
  ITC: 'itcportal.com',
  HINDUNILVR: 'hul.co.in',
  LT: 'larsentoubro.com',
  BAJFINANCE: 'bajajfinserv.in',
  HCLTECH: 'hcltech.com',
  MARUTI: 'marutisuzuki.com',
  SUNPHARMA: 'sunpharma.com',
  TATASTEEL: 'tatasteel.com',
  KOTAKBANK: 'kotak.com',
  AXISBANK: 'axisbank.com',
  TITAN: 'titancompany.in',
  ONGC: 'ongcindia.com',
  NTPC: 'ntpc.co.in',
  INDUSINDBK: 'indusind.com',
  POWERGRID: 'powergrid.in',
  ADANIENT: 'adani.com',
  ADANIPORTS: 'adaniports.com',
  COALINDIA: 'coalindia.in',
  BAJAJFINSV: 'bajajfinserv.in',
  ULTRACEMCO: 'ultratechcement.com',
  ASIANPAINT: 'asianpaints.com',
  'M&M': 'mahindra.com',
  JSWSTEEL: 'jsw.in',
  TRENT: 'mytrent.com',
  BEL: 'bel-india.in',
  GRASIM: 'grasim.com',
  HINDALCO: 'hindalco.com',
  CIPLA: 'cipla.com',
  DRREDDY: 'drreddys.com',
  APOLLOHOSP: 'apollohospitals.com',
  EICHERMOT: 'eicher.in',
  DIVISLAB: 'divislabs.com',
  BPCL: 'bharatpetroleum.in',
  NESTLEIND: 'nestle.in',
  BRITANNIA: 'britannia.co.in',
  TATACONSUM: 'tataconsumer.com',
  HEROMOTOCO: 'heromotocorp.com',
  WIPRO: 'wipro.com',
  TECHM: 'techmahindra.com',
  SBILIFE: 'sbilife.co.in',
  HDFCLIFE: 'hdfclife.com',
  SHRIRAMFIN: 'shriramfinance.in',
  'BAJAJ-AUTO': 'bajajauto.com',
  ZOMATO: 'zomato.com',
  JIOFIN: 'jfs.in',
  TATAMOTORS: 'tatamotors.com',
  DLF: 'dlf.in',
  HAL: 'hal-india.co.in',
  VEDL: 'vedantalimited.com',
  CHOLAFIN: 'cholamandalam.com',
  TORNTPHARM: 'torrentpharma.com',
  SIEMENS: 'siemens.com',
  ABB: 'abb.com',
  VBL: 'varunbeverages.com',
  PIDILITIND: 'pidilite.com',
  HAVELLS: 'havells.com',
  POLYCAB: 'polycab.com',
  SUZLON: 'suzlon.com',
  PERSISTENT: 'persistent.com',
  LTIM: 'ltimindtree.com',
  INDHOTEL: 'ihcltata.com',
  BANKBARODA: 'bankofbaroda.in',
  PNB: 'pnbindia.in',
  TVSMOTOR: 'tvsmotor.com',
  IRCTC: 'irctc.co.in',
  BOSCHLTD: 'bosch.in',
  GAIL: 'gailonline.com',
  IOC: 'iocl.com',
};

const BRAND_INITIALS: Record<string, string> = {
  AAPL: '',
  NVDA: 'NV',
  MSFT: 'MS',
  GOOGL: 'G',
  AMZN: 'AMZ',
  META: 'META',
  TSLA: 'T',
  'BRK-B': 'BH',
  AVGO: 'AV',
  JPM: 'JPM',
  V: 'VISA',
  MA: 'MC',
  WMT: 'WMT',
  LLY: 'LLY',
  UNH: 'UNH',
  XOM: 'XOM',
  COST: 'COST',
  HD: 'HD',
  AMD: 'AMD',
  QCOM: 'QC',
  TXN: 'TXN',
  ORCL: 'ORCL',
  CRM: 'CRM',
  ADBE: 'ADBE',
  CSCO: 'CSCO',
  BAC: 'BAC',
  PG: 'PG',
  JNJ: 'JNJ',
  NFLX: 'N',
  DIS: 'DIS',
  CAT: 'CAT',
  GE: 'GE',

  RELIANCE: 'RIL',
  TCS: 'TCS',
  HDFCBANK: 'HDFC',
  ICICIBANK: 'ICICI',
  BHARTIARTL: 'AT',
  INFY: 'INFY',
  SBIN: 'SBI',
  ITC: 'ITC',
  HINDUNILVR: 'HUL',
  LT: 'L&T',
  BAJFINANCE: 'BF',
  HCLTECH: 'HCL',
  MARUTI: 'MS',
  SUNPHARMA: 'SUN',
  TATASTEEL: 'TS',
  KOTAKBANK: 'KM',
  AXISBANK: 'AXIS',
  TITAN: 'TTN',
  ONGC: 'ONGC',
  NTPC: 'NTPC',
  INDUSINDBK: 'INDB',
  POWERGRID: 'PG',
  ADANIENT: 'AE',
  ADANIPORTS: 'AP',
  COALINDIA: 'CIL',
  BAJAJFINSV: 'BFS',
  ULTRACEMCO: 'UTC',
  ASIANPAINT: 'AP',
  'M&M': 'M&M',
  JSWSTEEL: 'JSW',
  TRENT: 'TR',
  BEL: 'BEL',
  GRASIM: 'GR',
  HINDALCO: 'HAL',
  CIPLA: 'CP',
  DRREDDY: 'DRL',
  APOLLOHOSP: 'APO',
  EICHERMOT: 'EM',
  DIVISLAB: 'DIV',
  BPCL: 'BPCL',
  NESTLEIND: 'NES',
  BRITANNIA: 'BRIT',
  TATACONSUM: 'TC',
  HEROMOTOCO: 'HM',
  WIPRO: 'WIP',
  TECHM: 'TM',
  SBILIFE: 'SBL',
  HDFCLIFE: 'HDL',
  SHRIRAMFIN: 'SF',
  'BAJAJ-AUTO': 'BA',
  ZOMATO: 'ZM',
  JIOFIN: 'JIO',
  TATAMOTORS: 'TTM',
  DLF: 'DLF',
  HAL: 'HAL',
  VEDL: 'VEDL',
  SIEMENS: 'SIE',
  ABB: 'ABB',
  VBL: 'VBL',
};

/**
 * Built-in crisp SVG brand logos for major leaders (TradingView identical)
 */
function BrandSvg({ symbol, size }: { symbol: string; size: number }) {
  if (symbol === 'AAPL') {
    return (
      <svg viewBox="0 0 170 170" width={size} height={size} fill="white">
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-5.88-8.91-10.45-19.12-13.72-30.63-3.26-11.51-4.9-22.11-4.9-31.78 0-14.35 3.58-26.06 10.74-35.13 7.17-9.08 16.19-13.72 27.06-13.93 4.8 0 10.11 1.25 15.93 3.76 5.81 2.5 9.73 3.81 11.75 3.91 1.57-.1 5.76-1.52 12.56-4.25 6.79-2.73 12.44-3.93 16.94-3.6 12.51.75 22.28 5.61 29.31 14.59-10.99 6.64-16.38 15.66-16.16 27.06.22 9.03 3.69 16.63 10.42 22.82 6.72 6.19 14.58 9.77 23.57 10.74-1.96 5.88-4.25 11.77-6.86 17.68zM119.22 33.15c0-7.06 2.55-13.74 7.66-20.03 5.1-6.29 11.45-10.4 19.04-12.33.22 1.3.33 2.61.33 3.92 0 7.07-2.67 14.04-8 20.91-5.33 6.86-11.87 10.87-19.62 12.02-.11-1.52-.16-2.61-.16-3.29l.75-1.2z" />
      </svg>
    );
  }

  if (symbol === 'NVDA') {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-[#76b900] shadow-sm shrink-0"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" width={size * 0.72} height={size * 0.72} fill="white">
          <path d="M8.88 4.22c-2.3.4-4.5 1.7-5.9 3.6-1.6 2.1-2.2 4.8-1.7 7.4.5 2.5 2 4.7 4.1 6.1 2.1 1.3 4.7 1.7 7.1 1.1 2.4-.6 4.5-2.1 5.7-4.2 1.2-2.1 1.4-4.7.7-7-.7-2.3-2.3-4.2-4.4-5.3-1.8-.9-3.8-1.3-5.6-1.7zm1.1 2.2c1.4.3 2.8.9 4 1.8 1.5 1.1 2.5 2.7 2.8 4.5.3 1.8-.1 3.7-1.1 5.3-.9 1.5-2.4 2.6-4.1 3-1.7.4-3.5.1-5-0.9-1.5-1-2.5-2.6-2.8-4.4-.3-1.8.1-3.7 1.1-5.2 1.1-1.7 2.8-2.9 4.7-3.3l.4-.8z" />
        </svg>
      </div>
    );
  }

  if (symbol === 'MSFT') {
    return (
      <div
        className="grid grid-cols-2 gap-0.5 rounded-[3px] p-0.5 bg-black/40 border border-white/20 shrink-0"
        style={{ width: size, height: size }}
      >
        <div className="bg-[#f25022] rounded-[1px]" />
        <div className="bg-[#7fba00] rounded-[1px]" />
        <div className="bg-[#00a4ef] rounded-[1px]" />
        <div className="bg-[#ffb900] rounded-[1px]" />
      </div>
    );
  }

  if (symbol === 'GOOGL' || symbol === 'GOOG') {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-white shadow-sm shrink-0"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" width={size * 0.65} height={size * 0.65}>
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.25 21.36 7.34 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
          />
        </svg>
      </div>
    );
  }

  if (symbol === 'AMZN') {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-[#131921] border border-white/20 shadow-sm shrink-0"
        style={{ width: size, height: size }}
      >
        <span className="font-black text-[#ff9900] text-[11px] tracking-tighter">a</span>
      </div>
    );
  }

  if (symbol === 'TSLA') {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-[#e82127] shadow-sm shrink-0"
        style={{ width: size, height: size }}
      >
        <span className="font-serif font-bold text-white text-[12px] leading-none">T</span>
      </div>
    );
  }

  if (symbol === 'META') {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-[#0081fb] shadow-sm shrink-0"
        style={{ width: size, height: size }}
      >
        <span className="font-sans font-bold text-white text-[12px] leading-none">∞</span>
      </div>
    );
  }

  return null;
}

function StockLogo({ symbol, size = 26 }: { symbol: string; size?: number }) {
  const [hasError, setHasError] = useState(false);
  const domain = STOCK_DOMAINS[symbol];
  const brandBadge = BRAND_INITIALS[symbol] || symbol.slice(0, 3);

  // Check built-in SVG first for perfect rendering
  const svg = BrandSvg({ symbol, size });
  if (svg) return svg;

  if (domain && !hasError) {
    return (
      <div
        className="relative flex items-center justify-center rounded-full bg-white/95 p-0.5 shadow-sm border border-white/20 overflow-hidden shrink-0"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
          alt={symbol}
          className="size-full rounded-full object-contain"
          onError={() => setHasError(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-black/45 border border-white/25 shadow-inner shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="text-[9px] font-semibold text-white/90 leading-none">{brandBadge}</span>
    </div>
  );
}

interface ActiveHoverTile {
  stock: HeatmapData;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function MarketHeatmap({
  data,
  currentIndex = 'nifty50',
  currencySymbol = '₹',
  onIndexChange,
  onRefresh,
  isRefreshing = false,
  isLoadingIndex = false,
}: MarketHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 1100,
    height: 640,
  });

  // Interactive UI state
  const [sizeMetric, setSizeMetric] = useState<SizeMetric>('marketCap');
  const [colorMetric, setColorMetric] = useState<ColorMetric>('change1D');
  const [sortBy, setSortBy] = useState<SortOption>('capDesc');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active Dropdown state (one open at a time)
  const [openDropdown, setOpenDropdown] = useState<
    'title' | 'index' | 'size' | 'color' | 'sector' | 'sort' | null
  >(null);

  // Hover state anchored directly to mouse cursor for fluid TradingView feel
  const [hoveredTile, setHoveredTile] = useState<ActiveHoverTile | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('.heatmap-dropdown-container')) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  // ResizeObserver for responsive layout
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width } = entry.contentRect;
        if (width > 0) {
          const targetHeight = isFullscreen
            ? Math.max(window.innerHeight - 130, 520)
            : Math.max(Math.round(width * 0.54), 540);
          setDimensions({ width, height: targetHeight });
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [isFullscreen]);

  // Derived sector list with stock counts
  const sectorList = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of data) {
      const sec = item.sector || 'Other';
      counts[sec] = (counts[sec] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [data]);

  // Sort and filter stocks before layout
  const processedData = useMemo(() => {
    let result = [...data];

    // Sector Filter
    if (selectedSectorFilter !== 'All') {
      result = result.filter((d) => d.sector === selectedSectorFilter);
    }

    return result;
  }, [data, selectedSectorFilter]);

  // Group stocks by sector
  const sectorGroups = useMemo(() => {
    const groups: Record<string, HeatmapData[]> = {};
    for (const item of processedData) {
      const sec = item.sector || 'Other';
      if (!groups[sec]) groups[sec] = [];
      groups[sec].push(item);
    }

    // Sort stocks inside each sector based on selected sort option
    for (const sec in groups) {
      groups[sec]!.sort((a, b) => {
        if (sortBy === 'perfDesc') return b.change - a.change;
        if (sortBy === 'perfAsc') return a.change - b.change;
        if (sortBy === 'symbolAsc') return a.symbol.localeCompare(b.symbol);
        return b.size - a.size; // default capDesc
      });
    }

    return groups;
  }, [processedData, sortBy]);

  // Calculate Treemap layout
  const layout = useMemo(() => {
    const { width, height } = dimensions;
    if (width <= 0 || height <= 0 || processedData.length === 0) {
      return { sectorRects: [], stockTiles: [] };
    }

    const activeSectors = Object.entries(sectorGroups).map(([sec, stocks]) => ({
      name: sec,
      stocks,
      value:
        sizeMetric === 'equalWeight'
          ? stocks.length
          : stocks.reduce((sum, s) => sum + Math.max(s.size, 1), 0),
    }));

    // Step 1: Squarify Sectors across entire canvas
    const sectorRects = squarify(activeSectors, { x: 0, y: 0, w: width, h: height });

    // Step 2: Inside each sector, reserve 20px for header, then squarify stocks
    const allStockTiles: Array<{
      stock: HeatmapData;
      sectorName: string;
      sectorRect: Rect;
      x: number;
      y: number;
      w: number;
      h: number;
    }> = [];

    const sectorHeaderHeight = 20;

    for (const secLayout of sectorRects) {
      const { item: secData, x: sx, y: sy, w: sw, h: sh } = secLayout;
      const innerRect: Rect = {
        x: sx + 1,
        y: sy + sectorHeaderHeight,
        w: Math.max(0, sw - 2),
        h: Math.max(0, sh - sectorHeaderHeight - 1),
      };

      const stockItems = secData.stocks.map((st) => ({
        ...st,
        value: sizeMetric === 'equalWeight' ? 1000 : st.size,
      }));

      const stockLayouts = squarify(stockItems, innerRect);

      for (const stTile of stockLayouts) {
        allStockTiles.push({
          stock: stTile.item,
          sectorName: secData.name,
          sectorRect: { x: sx, y: sy, w: sw, h: sh },
          x: stTile.x,
          y: stTile.y,
          w: stTile.w,
          h: stTile.h,
        });
      }
    }

    return { sectorRects, stockTiles: allStockTiles };
  }, [dimensions, processedData, sectorGroups, sizeMetric]);

  const activeMatches = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.trim().toLowerCase();
    return new Set(
      data
        .filter((d) => d.symbol.toLowerCase().includes(q) || d.name.toLowerCase().includes(q))
        .map((d) => d.symbol)
    );
  }, [data, searchQuery]);

  const activeIndexConfig = INDEX_CONFIG[currentIndex] || INDEX_CONFIG.nifty50;

  const isFiltered =
    selectedSectorFilter !== 'All' ||
    sizeMetric !== 'marketCap' ||
    colorMetric !== 'change1D' ||
    sortBy !== 'capDesc' ||
    searchQuery.trim() !== '';

  const resetAllFilters = useCallback(() => {
    setSelectedSectorFilter('All');
    setSizeMetric('marketCap');
    setColorMetric('change1D');
    setSortBy('capDesc');
    setSearchQuery('');
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full select-none rounded-xl border border-zinc-800 bg-[#090b10] text-[#d1d4dc] font-sans transition-none',
        isFullscreen && 'fixed inset-0 z-50 rounded-none border-0 overflow-auto p-4 bg-[#08090b]'
      )}
    >
      {/* TradingView Identical Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/90 px-4 py-2 bg-[#131722]">
        {/* Left Interactive Dropdowns (TradingView Style) */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Main Heatmap Title Dropdown */}
          <div className="heatmap-dropdown-container relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'title' ? null : 'title')}
              className="flex items-center gap-1.5 font-semibold text-sm tracking-tight text-white hover:text-zinc-200 transition-colors"
            >
              <span>{activeIndexConfig.fullTitle}</span>
              <ChevronDown className="size-3.5 text-zinc-400" />
            </button>

            {openDropdown === 'title' && (
              <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-lg border border-zinc-700 bg-[#1e222d] p-1 text-xs shadow-2xl backdrop-blur-md">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-700/60">
                  Select Market Heatmap
                </div>
                {(Object.keys(INDEX_CONFIG) as HeatmapIndex[]).map((idxKey) => {
                  const cfg = INDEX_CONFIG[idxKey];
                  const isSelected = currentIndex === idxKey;
                  return (
                    <button
                      key={idxKey}
                      type="button"
                      onClick={() => {
                        onIndexChange?.(idxKey);
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left transition-colors',
                        isSelected ? 'bg-[#2a2e39] text-white' : 'text-zinc-300 hover:bg-[#2a2e39]/60'
                      )}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{cfg.flag}</span>
                          <span>{cfg.fullTitle}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-0.5">{cfg.description}</span>
                      </div>
                      {isSelected && <Check className="size-3.5 text-emerald-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block" />

          {/* 1. INDEX SELECTOR PILL (with Country Flag) */}
          <div className="heatmap-dropdown-container relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'index' ? null : 'index')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-normal border transition-colors',
                openDropdown === 'index'
                  ? 'border-zinc-500 bg-[#2a2e39] text-white'
                  : 'border-[#2a2e39] bg-[#1e222d] text-zinc-200 hover:bg-[#2a2e39] hover:text-white'
              )}
            >
              <span>{activeIndexConfig.flag}</span>
              <span>{activeIndexConfig.label}</span>
              <ChevronDown className="size-3 text-zinc-400" />
            </button>

            {openDropdown === 'index' && (
              <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-lg border border-zinc-700 bg-[#1e222d] p-1 text-xs shadow-2xl backdrop-blur-md">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-700/60">
                  Select Index Universe
                </div>
                {(Object.keys(INDEX_CONFIG) as HeatmapIndex[]).map((idxKey) => {
                  const cfg = INDEX_CONFIG[idxKey];
                  const isSelected = currentIndex === idxKey;
                  return (
                    <button
                      key={idxKey}
                      type="button"
                      onClick={() => {
                        onIndexChange?.(idxKey);
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left transition-colors',
                        isSelected ? 'bg-[#2a2e39] text-white' : 'text-zinc-300 hover:bg-[#2a2e39]/60'
                      )}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{cfg.flag}</span>
                          <span>{cfg.label}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-0.5">{cfg.description}</span>
                      </div>
                      {isSelected && <Check className="size-3.5 text-emerald-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. SIZE / WEIGHT METRIC PILL */}
          <div className="heatmap-dropdown-container relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'size' ? null : 'size')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-normal border transition-colors',
                sizeMetric !== 'marketCap'
                  ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                  : openDropdown === 'size'
                    ? 'border-zinc-500 bg-[#2a2e39] text-white'
                    : 'border-[#2a2e39] bg-[#1e222d] text-zinc-200 hover:bg-[#2a2e39] hover:text-white'
              )}
            >
              <SlidersHorizontal className="size-3 text-zinc-400" />
              <span>{sizeMetric === 'marketCap' ? 'Market cap' : 'Equal weight'}</span>
              <ChevronDown className="size-3 text-zinc-400" />
            </button>

            {openDropdown === 'size' && (
              <div className="absolute left-0 top-full z-50 mt-1.5 w-52 rounded-lg border border-zinc-700 bg-[#1e222d] p-1 text-xs shadow-2xl backdrop-blur-md">
                <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-700/60">
                  Tile Sizing Weight
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSizeMetric('marketCap');
                    setOpenDropdown(null);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left',
                    sizeMetric === 'marketCap'
                      ? 'bg-[#2a2e39] text-white font-medium'
                      : 'text-zinc-300 hover:bg-[#2a2e39]/60'
                  )}
                >
                  <span>Market cap (Valuation)</span>
                  {sizeMetric === 'marketCap' && <Check className="size-3 text-emerald-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSizeMetric('equalWeight');
                    setOpenDropdown(null);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left',
                    sizeMetric === 'equalWeight'
                      ? 'bg-[#2a2e39] text-white font-medium'
                      : 'text-zinc-300 hover:bg-[#2a2e39]/60'
                  )}
                >
                  <span>Equal weight (Uniform)</span>
                  {sizeMetric === 'equalWeight' && <Check className="size-3 text-emerald-400" />}
                </button>
              </div>
            )}
          </div>

          {/* 3. COLOR METRIC PILL */}
          <div className="heatmap-dropdown-container relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'color' ? null : 'color')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-normal border transition-colors',
                colorMetric !== 'change1D'
                  ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                  : openDropdown === 'color'
                    ? 'border-zinc-500 bg-[#2a2e39] text-white'
                    : 'border-[#2a2e39] bg-[#1e222d] text-zinc-200 hover:bg-[#2a2e39] hover:text-white'
              )}
            >
              <BarChart3 className="size-3 text-zinc-400" />
              <span>
                {colorMetric === 'change1D'
                  ? 'Change 1D, %'
                  : colorMetric === 'gainersOnly'
                    ? 'Gainers only'
                    : 'Losers only'}
              </span>
              <ChevronDown className="size-3 text-zinc-400" />
            </button>

            {openDropdown === 'color' && (
              <div className="absolute left-0 top-full z-50 mt-1.5 w-52 rounded-lg border border-zinc-700 bg-[#1e222d] p-1 text-xs shadow-2xl backdrop-blur-md">
                <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-700/60">
                  Color Mode
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setColorMetric('change1D');
                    setOpenDropdown(null);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left',
                    colorMetric === 'change1D'
                      ? 'bg-[#2a2e39] text-white font-medium'
                      : 'text-zinc-300 hover:bg-[#2a2e39]/60'
                  )}
                >
                  <span>Change 1D, % (Full Heatmap)</span>
                  {colorMetric === 'change1D' && <Check className="size-3 text-emerald-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setColorMetric('gainersOnly');
                    setOpenDropdown(null);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left',
                    colorMetric === 'gainersOnly'
                      ? 'bg-[#2a2e39] text-white font-medium'
                      : 'text-zinc-300 hover:bg-[#2a2e39]/60'
                  )}
                >
                  <span className="text-emerald-400">Gainers only (+)</span>
                  {colorMetric === 'gainersOnly' && <Check className="size-3 text-emerald-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setColorMetric('losersOnly');
                    setOpenDropdown(null);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left',
                    colorMetric === 'losersOnly'
                      ? 'bg-[#2a2e39] text-white font-medium'
                      : 'text-zinc-300 hover:bg-[#2a2e39]/60'
                  )}
                >
                  <span className="text-red-400">Losers only (-)</span>
                  {colorMetric === 'losersOnly' && <Check className="size-3 text-red-400" />}
                </button>
              </div>
            )}
          </div>

          {/* 4. SECTOR FILTER PILL */}
          <div className="heatmap-dropdown-container relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'sector' ? null : 'sector')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-normal border transition-colors',
                selectedSectorFilter !== 'All'
                  ? 'border-indigo-500/50 bg-indigo-950/40 text-indigo-300'
                  : openDropdown === 'sector'
                    ? 'border-zinc-500 bg-[#2a2e39] text-white'
                    : 'border-[#2a2e39] bg-[#1e222d] text-zinc-200 hover:bg-[#2a2e39] hover:text-white'
              )}
            >
              <Layers className="size-3 text-zinc-400" />
              <span>{selectedSectorFilter === 'All' ? 'Sector' : selectedSectorFilter}</span>
              <ChevronDown className="size-3 text-zinc-400" />
            </button>

            {openDropdown === 'sector' && (
              <div className="absolute left-0 top-full z-50 mt-1.5 max-h-72 w-56 overflow-y-auto rounded-lg border border-zinc-700 bg-[#1e222d] p-1 text-xs shadow-2xl backdrop-blur-md">
                <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-700/60">
                  Filter by Sector
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSectorFilter('All');
                    setOpenDropdown(null);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left',
                    selectedSectorFilter === 'All'
                      ? 'bg-[#2a2e39] text-white font-medium'
                      : 'text-zinc-300 hover:bg-[#2a2e39]/60'
                  )}
                >
                  <span>All Sectors ({data.length})</span>
                  {selectedSectorFilter === 'All' && <Check className="size-3 text-emerald-400" />}
                </button>
                {sectorList.map(([sec, count]) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      setSelectedSectorFilter(sec);
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left',
                      selectedSectorFilter === sec
                        ? 'bg-[#2a2e39] text-white font-medium'
                        : 'text-zinc-300 hover:bg-[#2a2e39]/60'
                    )}
                  >
                    <span className="truncate">{sec}</span>
                    <span className="text-[10px] text-zinc-400 ml-2">({count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 5. SORT ORDER PILL */}
          <div className="heatmap-dropdown-container relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-normal border transition-colors',
                sortBy !== 'capDesc'
                  ? 'border-indigo-500/50 bg-indigo-950/40 text-indigo-300'
                  : openDropdown === 'sort'
                    ? 'border-zinc-500 bg-[#2a2e39] text-white'
                    : 'border-[#2a2e39] bg-[#1e222d] text-zinc-200 hover:bg-[#2a2e39] hover:text-white'
              )}
            >
              <ArrowUpDown className="size-3 text-zinc-400" />
              <span>
                {sortBy === 'capDesc'
                  ? 'Sort: Market Cap'
                  : sortBy === 'perfDesc'
                    ? 'Top Gainers'
                    : sortBy === 'perfAsc'
                      ? 'Top Losers'
                      : 'Symbol A-Z'}
              </span>
              <ChevronDown className="size-3 text-zinc-400" />
            </button>

            {openDropdown === 'sort' && (
              <div className="absolute left-0 top-full z-50 mt-1.5 w-52 rounded-lg border border-zinc-700 bg-[#1e222d] p-1 text-xs shadow-2xl backdrop-blur-md">
                <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-700/60">
                  Sort Order Inside Clusters
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('capDesc');
                    setOpenDropdown(null);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left',
                    sortBy === 'capDesc'
                      ? 'bg-[#2a2e39] text-white font-medium'
                      : 'text-zinc-300 hover:bg-[#2a2e39]/60'
                  )}
                >
                  <span>Market Cap (Largest First)</span>
                  {sortBy === 'capDesc' && <Check className="size-3 text-emerald-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('perfDesc');
                    setOpenDropdown(null);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left',
                    sortBy === 'perfDesc'
                      ? 'bg-[#2a2e39] text-white font-medium'
                      : 'text-zinc-300 hover:bg-[#2a2e39]/60'
                  )}
                >
                  <span>Performance (Gainers First)</span>
                  {sortBy === 'perfDesc' && <Check className="size-3 text-emerald-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('perfAsc');
                    setOpenDropdown(null);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left',
                    sortBy === 'perfAsc'
                      ? 'bg-[#2a2e39] text-white font-medium'
                      : 'text-zinc-300 hover:bg-[#2a2e39]/60'
                  )}
                >
                  <span>Performance (Losers First)</span>
                  {sortBy === 'perfAsc' && <Check className="size-3 text-emerald-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('symbolAsc');
                    setOpenDropdown(null);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left',
                    sortBy === 'symbolAsc'
                      ? 'bg-[#2a2e39] text-white font-medium'
                      : 'text-zinc-300 hover:bg-[#2a2e39]/60'
                  )}
                >
                  <span>Symbol (A to Z)</span>
                  {sortBy === 'symbolAsc' && <Check className="size-3 text-emerald-400" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Search & Utility Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 size-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search (e.g. RELIANCE, AAPL)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 w-44 rounded-md border border-[#2a2e39] bg-[#1e222d] pl-8 pr-6 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Reset All Filters Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="flex items-center gap-1 rounded-md bg-[#1e222d] border border-[#2a2e39] px-2.5 py-1 text-xs text-zinc-300 hover:bg-[#2a2e39] hover:text-white transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </button>
          )}

          {/* Refresh Quotes */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex size-7 items-center justify-center rounded-md border border-[#2a2e39] bg-[#1e222d] text-zinc-300 hover:bg-[#2a2e39] hover:text-white transition-colors disabled:opacity-50"
              title="Refresh Quotes"
            >
              <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin text-emerald-400')} />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex size-7 items-center justify-center rounded-md border border-[#2a2e39] bg-[#1e222d] text-zinc-300 hover:bg-[#2a2e39] hover:text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Heatmap Canvas */}
      <div
        className="relative overflow-hidden bg-[#000000]"
        style={{
          width: '100%',
          height: dimensions.height,
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }}
        onMouseLeave={() => {
          setHoveredTile(null);
          setMousePos(null);
        }}
      >
        {/* Loading Overlay while switching index universe */}
        {isLoadingIndex && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2.5 bg-black/60 backdrop-blur-[2px]">
            <div className="size-8 rounded-full border-2 border-zinc-600 border-t-emerald-500 animate-spin" />
            <span className="text-xs font-mono text-zinc-300">
              Loading {activeIndexConfig.label}...
            </span>
          </div>
        )}

        {/* Sector Bounding Boxes & Headers (TradingView Style) */}
        {layout.sectorRects?.map((sec) => {
          const isSelected = selectedSectorFilter === sec.item.name;

          return (
            <div
              key={sec.item.name}
              className={cn(
                'absolute pointer-events-none border border-black/80 bg-transparent transition-none',
                isSelected && 'border-zinc-500 ring-1 ring-zinc-500/50'
              )}
              style={{
                left: sec.x,
                top: sec.y,
                width: sec.w,
                height: sec.h,
              }}
            >
              {/* Sector Title Label (TradingView Style: Title-case, clean muted text) */}
              <div
                className="pointer-events-auto flex items-center gap-1 px-1.5 h-[20px] text-[11px] font-normal text-zinc-400 hover:text-zinc-200 cursor-pointer select-none truncate"
                onClick={() =>
                  setSelectedSectorFilter(
                    selectedSectorFilter === sec.item.name ? 'All' : sec.item.name
                  )
                }
              >
                <span className="truncate">{sec.item.name}</span>
                <ChevronRight className="size-3 opacity-60 shrink-0" />
              </div>
            </div>
          );
        })}

        {/* Stock Tiles Inside Sectors */}
        {layout.stockTiles?.map((tile) => {
          const { stock, x, y, w, h } = tile;
          const isDimmed = activeMatches && !activeMatches.has(stock.symbol);
          const color = getTradingViewColor(stock.change, colorMetric);
          const isHovered = hoveredTile?.stock.symbol === stock.symbol;

          // Adaptive display thresholds
          const isHero = w >= 90 && h >= 80;
          const isMedium = w >= 56 && h >= 48;
          const isCompact = w >= 38 && h >= 28;

          return (
            <div
              key={stock.symbol}
              className={cn(
                'absolute cursor-pointer border-[1px] border-black rounded-[2px] p-1 flex flex-col items-center justify-center select-none transition-none',
                isDimmed && 'opacity-20 saturate-50',
                isHovered && 'z-30 ring-2 ring-white/95 brightness-110 shadow-2xl'
              )}
              style={{
                left: x,
                top: y,
                width: Math.max(w - 1, 0),
                height: Math.max(h - 1, 0),
                backgroundColor: color,
              }}
              onMouseEnter={() => setHoveredTile(tile)}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/portfolio/${stock.symbol}`;
                }
              }}
            >
              {/* Hero / Large Tile (TradingView Standard: Clean Brand Image/Logo + Symbol + Change) */}
              {isHero ? (
                <div className="flex h-full w-full flex-col items-center justify-center text-center p-1">
                  {/* Stock Brand Logo / Image */}
                  <div className="mb-1.5">
                    <StockLogo symbol={stock.symbol} size={34} />
                  </div>

                  {/* Stock Symbol */}
                  <span className="text-sm sm:text-base font-semibold tracking-tight text-white leading-tight">
                    {stock.symbol}
                  </span>

                  {/* Percentage Change (Clean, crisp, no clutter) */}
                  <span className="mt-1 font-mono text-xs sm:text-sm font-medium text-white/95 leading-tight">
                    {stock.change > 0 ? '+' : ''}
                    {stock.change.toFixed(2)}%
                  </span>
                </div>
              ) : isMedium ? (
                /* Medium Tile */
                <div className="flex h-full w-full flex-col items-center justify-center text-center p-0.5">
                  {h >= 54 && (
                    <div className="mb-1">
                      <StockLogo symbol={stock.symbol} size={20} />
                    </div>
                  )}
                  <span className="text-xs font-semibold tracking-tight text-white leading-tight">
                    {stock.symbol}
                  </span>
                  <span className="font-mono text-[11px] font-medium text-white/95 leading-tight mt-0.5">
                    {stock.change > 0 ? '+' : ''}
                    {stock.change.toFixed(2)}%
                  </span>
                </div>
              ) : isCompact ? (
                /* Compact Tile */
                <div className="flex h-full w-full flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-medium tracking-tight text-white leading-tight">
                    {stock.symbol}
                  </span>
                  <span className="font-mono text-[9px] font-normal text-white/90 leading-none mt-0.5">
                    {stock.change > 0 ? '+' : ''}
                    {stock.change.toFixed(1)}%
                  </span>
                </div>
              ) : (
                /* Micro Tile */
                <div className="flex h-full w-full items-center justify-center text-center overflow-hidden">
                  <span className="text-[8px] font-normal text-white/90 leading-none truncate">
                    {stock.symbol}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Cursor-Anchored Floating Tooltip (Fixes popup opening somewhere else!) */}
        {hoveredTile && mousePos && (
          (() => {
            const tooltipWidth = 240;
            const tooltipHeight = 125;

            // Position relative to cursor with flip near edges
            let tx = mousePos.x + 16;
            let ty = mousePos.y + 16;

            if (tx + tooltipWidth > dimensions.width - 12) {
              tx = mousePos.x - tooltipWidth - 16;
            }
            if (ty + tooltipHeight > dimensions.height - 12) {
              ty = mousePos.y - tooltipHeight - 16;
            }
            tx = Math.max(10, tx);
            ty = Math.max(10, ty);

            const { stock } = hoveredTile;

            return (
              <div
                className="pointer-events-none absolute z-50 rounded-lg border border-zinc-700/80 bg-[#14171f]/95 p-3 text-xs text-white shadow-2xl backdrop-blur-md transition-none"
                style={{
                  left: `${tx}px`,
                  top: `${ty}px`,
                  width: `${tooltipWidth}px`,
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2 pr-2">
                    <StockLogo symbol={stock.symbol} size={28} />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white leading-tight">
                        {stock.symbol}
                      </span>
                      <span className="text-[11px] text-zinc-400 truncate max-w-[125px]">
                        {stock.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                        {stock.sector}
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'rounded px-1.5 py-0.5 font-mono text-xs font-semibold shrink-0',
                      stock.change >= 0
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    )}
                  >
                    {stock.change > 0 ? '+' : ''}
                    {stock.change.toFixed(2)}%
                  </div>
                </div>

                {/* Metrics */}
                <div className="mt-2 space-y-1 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Price</span>
                    <span className="font-medium text-white">
                      {currencySymbol}
                      {stock.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Market Cap</span>
                    <span className="text-zinc-300">
                      {currencySymbol === '$'
                        ? `$${(stock.size / 1000).toFixed(1)}B`
                        : `₹${(stock.size / 1000).toFixed(1)}K Cr`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* TradingView Bottom Color Scale Legend & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800/90 px-4 py-2 bg-[#131722] text-[11px] text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="font-medium text-zinc-300">Performance</span>
          <div className="flex items-center gap-1 font-mono text-[10px]">
            <span className="text-zinc-400">-3%</span>
            <div className="flex items-center gap-0.5">
              <span className="size-3.5 rounded-[2px]" style={{ backgroundColor: '#c51f26' }} />
              <span className="size-3.5 rounded-[2px]" style={{ backgroundColor: '#a82329' }} />
              <span className="size-3.5 rounded-[2px]" style={{ backgroundColor: '#4a181d' }} />
              <span className="size-3.5 rounded-[2px]" style={{ backgroundColor: '#181b22' }} />
              <span className="size-3.5 rounded-[2px]" style={{ backgroundColor: '#154228' }} />
              <span className="size-3.5 rounded-[2px]" style={{ backgroundColor: '#168a48' }} />
              <span className="size-3.5 rounded-[2px]" style={{ backgroundColor: '#00b050' }} />
            </div>
            <span className="text-zinc-400">+3%</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-zinc-400 font-mono text-xs">
          <span>{processedData.length} Stocks</span>
          <span>•</span>
          <span className="text-emerald-400 font-medium">
            ▲ {processedData.filter((d) => d.change > 0).length} Up
          </span>
          <span>•</span>
          <span className="text-red-400 font-medium">
            ▼ {processedData.filter((d) => d.change < 0).length} Down
          </span>
        </div>
      </div>
    </div>
  );
}
