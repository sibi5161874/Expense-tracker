/**
 * ============================================================================
 * ASSET-CLASS IMPORT SCHEMAS & TEMPLATES
 * ============================================================================
 * Defines required/optional columns and example headers for adaptive CSV import.
 * When importing holdings or trades, users choose their asset class (Stock, MF,
 * ETF, Gold) to get contextual column headers, guidance, and validation terms.
 * ============================================================================
 */

export type ImportAssetClass = 'Stock' | 'Mutual Fund' | 'ETF' | 'Gold';

export interface AssetClassColumnSchema {
  required_columns: string[];
  optional_columns: string[];
  example_headers: string[];
}

export const ASSET_CLASS_IMPORT_SCHEMAS: Record<ImportAssetClass, AssetClassColumnSchema> = {
  Stock: {
    required_columns: ['symbol', 'quantity', 'buy_price', 'date'],
    optional_columns: ['exchange', 'fees', 'action'],
    example_headers: ['Symbol', 'Qty', 'Buy Price', 'Date', 'Exchange'],
  },
  'Mutual Fund': {
    required_columns: ['scheme_name', 'units', 'nav', 'date'],
    optional_columns: ['folio_number', 'action', 'fees'],
    example_headers: ['Scheme Name', 'Units', 'NAV', 'Date', 'Folio'],
  },
  ETF: {
    required_columns: ['symbol', 'quantity', 'buy_price', 'date'],
    optional_columns: ['exchange', 'fees'],
    example_headers: ['Ticker', 'Units', 'Price', 'Date', 'Exchange'],
  },
  Gold: {
    required_columns: ['description', 'grams', 'rate_per_gram', 'date'],
    optional_columns: ['purity', 'vendor'],
    example_headers: ['Description', 'Grams', 'Rate', 'Date', 'Purity'],
  },
};

export interface MappableField {
  key: string;
  label: string;
  required?: boolean;
  hint?: string;
}

/**
 * Returns the contextual list of mappable fields for ColumnMapper based on selected asset class.
 */
export function getMappableFieldsForAssetType(assetType?: string): MappableField[] {
  switch (assetType) {
    case 'Mutual Fund':
      return [
        { key: 'date', label: 'NAV Date / Transaction Date', required: true },
        { key: 'scheme_name', label: 'Scheme Name', required: true },
        { key: 'units', label: 'Units', required: true },
        { key: 'nav', label: 'NAV (Price per unit)', required: true },
        { key: 'folio_number', label: 'Folio Number', hint: 'Optional' },
        { key: 'action', label: 'Action (SIP / BUY / SELL)', hint: 'Optional — defaults to BUY' },
        { key: 'fees', label: 'Stamp Duty / Fees', hint: 'Optional' },
      ];
    case 'ETF':
      return [
        { key: 'date', label: 'Trade Date', required: true },
        { key: 'symbol', label: 'Ticker / Symbol', required: true },
        { key: 'quantity', label: 'Units / Quantity', required: true },
        { key: 'buy_price', label: 'Price per unit', required: true },
        { key: 'exchange', label: 'Exchange', hint: 'Optional — defaults to NSE' },
        { key: 'fees', label: 'Brokerage / Fees', hint: 'Optional' },
      ];
    case 'Gold':
      return [
        { key: 'date', label: 'Purchase Date', required: true },
        { key: 'description', label: 'Description', required: true },
        { key: 'grams', label: 'Weight (Grams)', required: true },
        { key: 'rate_per_gram', label: 'Rate per Gram', required: true },
        { key: 'purity', label: 'Purity (e.g. 24K, 22K)', hint: 'Optional' },
        { key: 'vendor', label: 'Vendor / Jeweller', hint: 'Optional' },
      ];
    case 'Stock':
    default:
      return [
        { key: 'date', label: 'Trade Date', required: true },
        { key: 'symbol', label: 'Stock Symbol', required: true },
        { key: 'quantity', label: 'Quantity (Shares)', required: true },
        { key: 'buy_price', label: 'Buy Price', required: true },
        { key: 'exchange', label: 'Exchange', hint: 'Optional — defaults to NSE' },
        { key: 'action', label: 'Action (BUY / SELL)', hint: 'Optional — defaults to BUY' },
        { key: 'fees', label: 'Brokerage / Fees', hint: 'Optional' },
      ];
  }
}
