/**
 * Deterministic NLP Extraction Engine for Quick-Add.
 * Zero external AI / 0% investment: runs 100% locally in TypeScript with <1ms execution time.
 * Supports multi-domain parsing: Transactions (Income/Expense), Cashbook (Gave/Got), and Investments (Buy/Sell).
 */

export type QuickAddIntent = 'transaction' | 'cashbook' | 'investment';

export interface ParsedTransactionData {
  type: 'Income' | 'Expense';
  amount?: number;
  category?: string;
  notes?: string;
  date?: string; // YYYY-MM-DD
}

export interface ParsedCashbookData {
  flow: 'Gave' | 'Received';
  amount?: number;
  counterparty?: string;
  notes?: string;
  date?: string; // YYYY-MM-DD
}

export interface ParsedInvestmentData {
  action: 'BUY' | 'SELL';
  asset_type: 'Stock' | 'ETF' | 'Mutual Fund' | 'Crypto' | 'Bond' | 'Other';
  symbol?: string;
  quantity?: number;
  price?: number;
  amount?: number;
  date?: string; // YYYY-MM-DD
  notes?: string;
}

export interface ParsedQuickAddResult {
  rawText: string;
  intent: QuickAddIntent;
  confidence: 'high' | 'medium' | 'low';
  transaction?: ParsedTransactionData;
  cashbook?: ParsedCashbookData;
  investment?: ParsedInvestmentData;
}

// -----------------------------------------------------------------------------
// 1. Extensible Rule Dictionaries
// -----------------------------------------------------------------------------

export interface CategoryKeywordRule {
  category: string;
  keywords: string[];
}

export const DEFAULT_CATEGORY_RULES: CategoryKeywordRule[] = [
  {
    category: 'Food & Dining',
    keywords: [
      'coffee', 'tea', 'chai', 'swiggy', 'zomato', 'dinner', 'lunch', 'breakfast',
      'restaurant', 'food', 'snacks', 'burger', 'pizza', 'cafe', 'starbucks', 'dmart',
      'grocery', 'groceries', 'milk', 'vegetables', 'fruits', 'biryani', 'cake', 'bakery',
      'biscuit', 'ice cream', 'eat', 'ate', 'drink', 'beer', 'whiskey', 'bar'
    ],
  },
  {
    category: 'Transportation',
    keywords: [
      'uber', 'ola', 'cab', 'taxi', 'petrol', 'diesel', 'fuel', 'metro', 'bus',
      'train', 'flight', 'auto', 'parking', 'toll', 'rapido', 'airfare', 'ticket',
      'gasoline', 'cng', 'fastag'
    ],
  },
  {
    category: 'Bills & Utilities',
    keywords: [
      'electricity', 'water', 'wifi', 'broadband', 'internet', 'gas', 'lpg',
      'recharge', 'jio', 'airtel', 'vi', 'bill', 'maintenance', 'rent', 'power',
      'utility', 'utilities', 'cylinder'
    ],
  },
  {
    category: 'Shopping',
    keywords: [
      'amazon', 'flipkart', 'myntra', 'clothes', 'shoes', 'electronics', 'mall',
      'zara', 'h&m', 'purchase', 'dress', 'shirt', 'pants', 'phone', 'laptop',
      'gadget', 'bag', 'watch'
    ],
  },
  {
    category: 'Entertainment',
    keywords: [
      'movie', 'netflix', 'cinema', 'spotify', 'hotstar', 'prime', 'concert',
      'gaming', 'pub', 'club', 'party', 'youtube', 'theater', 'theatre', 'show'
    ],
  },
  {
    category: 'Health & Medical',
    keywords: [
      'doctor', 'medicine', 'pharmacy', 'hospital', 'clinic', 'lab', 'test',
      'gym', 'fitness', 'dentist', 'dental', 'medicines', 'apollo', 'medplus'
    ],
  },
  {
    category: 'Salary & Income',
    keywords: [
      'salary', 'bonus', 'freelance', 'client', 'dividend', 'cashback', 'refund',
      'stipend', 'consulting', 'credited', 'interest'
    ],
  },
];

const INCOME_TRIGGERS = [
  'salary', 'credited', 'received', 'refund', 'income', 'earned', 'dividend',
  'cashback', 'freelance', 'stipend', 'interest received', 'won', 'profit'
];

const CASHBOOK_GAVE_TRIGGERS = ['gave', 'lent', 'given to', 'paid to', 'sent to', 'lend'];
const CASHBOOK_GOT_TRIGGERS = ['got', 'received from', 'borrowed from', 'taken from', 'took from', 'repaid by'];

const INVESTMENT_TRIGGERS = [
  'bought shares', 'bought stock', 'sold shares', 'sold stock', 'sip', 'mutual fund',
  'invested in', 'invested', 'shares of', 'crypto', 'bitcoin', 'btc', 'eth', 'gold'
];

// -----------------------------------------------------------------------------
// 2. Helper Utilities
// -----------------------------------------------------------------------------

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Resolves relative or named dates from text */
function extractDate(text: string): { date: string; matchedToken?: string } {
  const lower = text.toLowerCase();
  const now = new Date();

  if (lower.includes('day before yesterday')) {
    const d = new Date(now);
    d.setDate(d.getDate() - 2);
    return { date: toISODate(d), matchedToken: 'day before yesterday' };
  }
  if (lower.includes('yesterday')) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return { date: toISODate(d), matchedToken: 'yesterday' };
  }
  if (lower.includes('today')) {
    return { date: toISODate(now), matchedToken: 'today' };
  }

  // YYYY-MM-DD pattern
  const isoMatch = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoMatch) {
    return { date: isoMatch[0], matchedToken: isoMatch[0] };
  }

  return { date: toISODate(now) };
}

/**
 * Extracts numbers that represent currency/amounts.
 * Handles ₹, $, rs, INR, commas like 1,500.50
 */
function extractAmount(text: string): { amount?: number; matchedToken?: string } {
  // Matches expressions like:
  // ₹ 500, $50, 500rs, 500 rs, rs 500, rs. 500, inr 500, 1,500.50, 30
  const patterns = [
    /(?:₹|\$|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:₹|\$|rs\.?|inr|bucks)/i,
    /\b(?:for|spent|paid|amount|got|gave|lent|received)\s*([\d,]+(?:\.\d{1,2})?)\b/i,
    /\b([\d,]+(?:\.\d{1,2})?)\b/,
  ];

  for (const regex of patterns) {
    const match = text.match(regex);
    if (match) {
      const numStr = (match[1] || match[0]).replace(/,/g, '');
      const parsed = parseFloat(numStr);
      if (!isNaN(parsed) && parsed > 0) {
        return { amount: parsed, matchedToken: match[0] };
      }
    }
  }

  return {};
}

// -----------------------------------------------------------------------------
// 3. Domain Parsers
// -----------------------------------------------------------------------------

function parseCashbook(text: string, amount?: number, date?: string): ParsedCashbookData | null {
  const lower = text.toLowerCase();

  let flow: 'Gave' | 'Received' = 'Gave';
  let counterparty = '';
  let triggerWord = '';

  for (const trigger of CASHBOOK_GOT_TRIGGERS) {
    if (lower.includes(trigger)) {
      flow = 'Received';
      triggerWord = trigger;
      break;
    }
  }

  if (!triggerWord) {
    for (const trigger of CASHBOOK_GAVE_TRIGGERS) {
      if (lower.includes(trigger)) {
        flow = 'Gave';
        triggerWord = trigger;
        break;
      }
    }
  }

  if (!triggerWord) return null;

  // Extract name: e.g. "gave 500 to rahul" or "lent amit 2000" or "got 1200 from priya"
  // Look for "to <name>" or "from <name>"
  const targetMatch = text.match(/\b(?:to|from)\s+([a-zA-Z0-9_\s]{2,20})\b/i);
  if (targetMatch && targetMatch[1]) {
    counterparty = targetMatch[1]
      .replace(/\b(today|yesterday|for|on|via|cash|gpay|upi)\b.*$/i, '')
      .trim();
  } else {
    // Look for "<verb> <name> <amount>" e.g. "lent amit 500"
    const directMatch = text.match(/(?:gave|lent|got)\s+([a-zA-Z]{2,15})\s+\d+/i);
    if (directMatch && directMatch[1]) {
      counterparty = directMatch[1].trim();
    }
  }

  // Capitalize name
  if (counterparty) {
    counterparty = counterparty.charAt(0).toUpperCase() + counterparty.slice(1);
  }

  // Clean notes
  let notes = text;
  if (triggerWord) notes = notes.replace(new RegExp(triggerWord, 'gi'), '');
  if (counterparty) notes = notes.replace(new RegExp(`\\b(?:to|from)?\\s*${counterparty}\\b`, 'gi'), '');
  notes = notes.replace(/\b(today|yesterday|day before yesterday|\d+|rs|inr|₹|\$)\b/gi, '').trim();

  return {
    flow,
    amount,
    counterparty: counterparty || undefined,
    notes: notes || undefined,
    date,
  };
}

function parseInvestment(text: string, defaultAmount?: number, date?: string): ParsedInvestmentData | null {
  const lower = text.toLowerCase();

  const isBuy = /\b(buy|bought|invest|invested|purchased|sip)\b/i.test(lower);
  const isSell = /\b(sell|sold)\b/i.test(lower);

  if (!isBuy && !isSell && !/\b(shares|crypto|mutual fund|stock|stocks)\b/i.test(lower)) {
    return null;
  }

  const action: 'BUY' | 'SELL' = isSell ? 'SELL' : 'BUY';

  // Asset type detection
  let asset_type: ParsedInvestmentData['asset_type'] = 'Stock';
  if (/\b(mutual fund|sip|mf|amfi|index fund|etf)\b/i.test(lower)) {
    asset_type = 'Mutual Fund';
  } else if (/\b(crypto|bitcoin|btc|ethereum|eth|sol|solana)\b/i.test(lower)) {
    asset_type = 'Crypto';
  } else if (/\b(gold|silver|sgb)\b/i.test(lower)) {
    asset_type = 'Other';
  }

  // Quantity and Price extraction
  // e.g. "bought 10 shares of RELIANCE at 2500" or "5 AAPL at 180"
  let quantity: number | undefined;
  let price: number | undefined;
  let symbol: string | undefined;

  const sharesMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:shares|units|coins|stocks)?\s*(?:of)?\s+([A-Za-z0-9\-&]+)(?:\s+at\s+([\d,]+(?:\.\d+)?))?/i);
  if (sharesMatch) {
    const q = parseFloat(sharesMatch[1] || '');
    if (!isNaN(q)) quantity = q;
    symbol = sharesMatch[2]?.toUpperCase();
    if (sharesMatch[3]) {
      const p = parseFloat(sharesMatch[3].replace(/,/g, ''));
      if (!isNaN(p)) price = p;
    }
  }

  // If no symbol from sharesMatch, look for symbol after "in"
  if (!symbol) {
    const inMatch = text.match(/\b(?:in|of)\s+([A-Za-z0-9\s\-&]+?)(?:\s+(?:at|for|today|yesterday|\d+)|$)/i);
    if (inMatch && inMatch[1]) {
      symbol = inMatch[1].trim();
      if (asset_type === 'Stock') symbol = symbol.toUpperCase();
    }
  }

  return {
    action,
    asset_type,
    symbol: symbol || undefined,
    quantity,
    price,
    amount: defaultAmount,
    date,
  };
}

function parseTransaction(text: string, amount?: number, date?: string): ParsedTransactionData {
  const lower = text.toLowerCase();

  // Type: Income vs Expense
  const isIncome = INCOME_TRIGGERS.some((trigger) => lower.includes(trigger));
  const type: 'Income' | 'Expense' = isIncome ? 'Income' : 'Expense';

  // Category Matching
  let category = 'Uncategorized';
  let matchedKeyword = '';

  for (const rule of DEFAULT_CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      const kwRegex = new RegExp(`\\b${kw}\\b`, 'i');
      if (kwRegex.test(lower)) {
        category = rule.category;
        matchedKeyword = kw;
        break;
      }
    }
    if (matchedKeyword) break;
  }

  // Clean remaining notes
  let notes = text;
  // Remove amount tokens
  notes = notes.replace(/\b(for|spent|paid|rs\.?|inr|₹|\$)\b/gi, '');
  if (matchedKeyword) {
    notes = notes.replace(new RegExp(`\\b${matchedKeyword}\\b`, 'gi'), '');
  }
  notes = notes.replace(/\b(today|yesterday|day before yesterday|\d+(\.\d{1,2})?)\b/gi, '').trim();

  // Clean double spaces and punctuation
  notes = notes.replace(/\s+/g, ' ').replace(/^[\s,.-]+|[\s,.-]+$/g, '').trim();

  // If notes became completely empty, use the matched category or original token
  if (!notes && matchedKeyword) {
    notes = matchedKeyword.charAt(0).toUpperCase() + matchedKeyword.slice(1);
  }

  return {
    type,
    amount,
    category,
    notes: notes || undefined,
    date,
  };
}

// -----------------------------------------------------------------------------
// 4. Primary Orchestrator Function
// -----------------------------------------------------------------------------

/**
 * Parses user input in natural language and extracts structured transaction,
 * cashbook, or investment data with confidence estimation.
 * 
 * Never auto-saves — returns pre-filled shape for user review & confirmation.
 */
export function parseTransactionText(text: string): ParsedQuickAddResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      rawText: text,
      intent: 'transaction',
      confidence: 'low',
      transaction: { type: 'Expense' },
    };
  }

  const { date } = extractDate(trimmed);
  const { amount } = extractAmount(trimmed);

  // 1. Check Cashbook Intent (gave to / got from)
  const cashbook = parseCashbook(trimmed, amount, date);
  if (cashbook && (cashbook.counterparty || cashbook.amount)) {
    const isHigh = Boolean(cashbook.amount && cashbook.counterparty);
    return {
      rawText: trimmed,
      intent: 'cashbook',
      confidence: isHigh ? 'high' : 'medium',
      cashbook,
    };
  }

  // 2. Check Investment Intent (shares, bought, sold, sip, stock, crypto)
  const isInvestmentPhrase = INVESTMENT_TRIGGERS.some((trig) => trimmed.toLowerCase().includes(trig)) ||
    /\b(shares|stock|stocks|crypto|btc|eth|mutual fund|sip|nav|holding|etf)\b/i.test(trimmed) ||
    /\b(bought|sold|buy|sell)\b.*\bat\s+\d+/i.test(trimmed) ||
    /\b(bought|sold|buy|sell)\s+\d+\s+[A-Za-z0-9]+/i.test(trimmed);

  if (isInvestmentPhrase) {
    const investment = parseInvestment(trimmed, amount, date);
    if (investment && (investment.symbol || investment.amount || investment.quantity)) {
      const isHigh = Boolean((investment.quantity && investment.price) || (investment.symbol && investment.amount));
      return {
        rawText: trimmed,
        intent: 'investment',
        confidence: isHigh ? 'high' : 'medium',
        investment,
      };
    }
  }

  // 3. Default: Transaction Intent (Income / Expense)
  const transaction = parseTransaction(trimmed, amount, date);
  const hasAmount = typeof transaction.amount === 'number' && transaction.amount > 0;
  const hasCategory = transaction.category !== 'Uncategorized';

  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (hasAmount && hasCategory) {
    confidence = 'high';
  } else if (hasAmount || hasCategory) {
    confidence = 'medium';
  }

  return {
    rawText: trimmed,
    intent: 'transaction',
    confidence,
    transaction,
  };
}
