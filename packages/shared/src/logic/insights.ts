/** Pure logic behind the dashboard's small "insight" cards — keyword matching and threshold rules that are cheap to get subtly wrong (case sensitivity, substring vs whole-word) and cheap to test. */

const COFFEE_KEYWORDS = ['swiggy', 'zomato', 'coffee', 'starbucks', 'tea', 'breakfast'];

/** Matches against notes + category + sub-category together — whichever field a user actually typed the merchant name into, not just one specific column. */
export function isCoffeeExpense(text: string): boolean {
  const lower = text.toLowerCase();
  return COFFEE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export interface CoffeeInsightTransaction {
  type: string;
  amount: number;
  notes?: string | null;
  category?: { name: string } | null;
  sub_category?: string | null;
}

/** Sums Expense-type transactions whose notes/category/sub-category mention a coffee/food-delivery keyword — the "what if you invested this instead" prompt on the dashboard. */
export function calculateCoffeeSpend(transactions: CoffeeInsightTransaction[]): number {
  return transactions
    .filter((t) => t.type === 'Expense')
    .filter((t) => isCoffeeExpense(`${t.notes ?? ''} ${t.category?.name ?? ''} ${t.sub_category ?? ''}`))
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Below this, the insight isn't worth showing — a ₹40 chai doesn't need a future-value lecture. */
export const COFFEE_INSIGHT_MIN_AMOUNT = 500;
