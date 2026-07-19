/**
 * CSV bulk-import template definitions — Transactions, Investment Log, Cashbook.
 * Column lists match the real Zod schemas field-for-field (see transaction.schema.ts,
 * investmentLog.schema.ts, cashbook.schema.ts). Account/Category/Linked Account/Account Used
 * columns hold human-readable NAMES, resolved to the caller's own account/category UUIDs
 * server-side during import — never raw ids.
 */

export const TRANSACTIONS_TEMPLATE_COLUMNS = [
  'Date',
  'Type',
  'Category',
  'Sub-Category',
  'Amount',
  'From Account',
  'To Account',
  'Notes',
] as const;

export const TRANSACTIONS_TEMPLATE_EXAMPLE_ROW = [
  '2026-07-01',
  'Expense',
  'Groceries',
  'Supermarket',
  '1500',
  'HDFC Bank',
  '',
  'EXAMPLE — delete this row',
];

export const INVESTMENT_LOG_TEMPLATE_COLUMNS = [
  'Date',
  'Symbol',
  'Exchange',
  'Action',
  'Quantity',
  'Price',
  'Fees',
  'Bonus/Split Extra Units',
  'Linked Account',
  'Asset Type',
  'Notes',
] as const;

export const INVESTMENT_LOG_TEMPLATE_EXAMPLE_ROW = [
  '2026-07-01',
  'RELIANCE',
  'NSE',
  'BUY',
  '10',
  '2900',
  '20',
  '',
  'Zerodha',
  'Stock',
  'EXAMPLE — delete this row',
];

export const CASHBOOK_TEMPLATE_COLUMNS = [
  'Date',
  'Counterparty',
  'Flow',
  'Amount',
  'Due Date',
  'Account Used',
  'Loan ID',
  'Notes',
] as const;

export const CASHBOOK_TEMPLATE_EXAMPLE_ROW = [
  '2026-07-01',
  'Rahul',
  'Gave',
  '5000',
  '2026-08-01',
  'HDFC Bank',
  '',
  'EXAMPLE — delete this row',
];

export const EXAMPLE_ROW_MARKER = 'EXAMPLE';
