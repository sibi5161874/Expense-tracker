/** YYYY-MM-01 for the calendar month containing `date`. */
export function monthStart(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/** "YYYY-MM" for the calendar month containing `date` — the `month` filter shape used by getTransactions/monthDateRange. */
export function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Days between `date` and today, floored at 0. Negative/zero means due or overdue. */
export function daysUntil(date: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

/** "5 min ago" / "2 hr ago" / "3 days ago" style relative timestamp, for "Last updated X ago" labels. */
export function formatRelativeTime(date: string | Date): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const diffSeconds = Math.max(0, Math.round((Date.now() - then.getTime()) / 1000));

  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export function isPastDate(date: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date).getTime() < today.getTime();
}

/**
 * [from, to) date bounds for a "YYYY-MM" month string — `date >= from AND date < to`.
 * `month` is derived from the transaction date at query time, never stored (DATA_MODEL.md §1).
 */
export function monthDateRange(month: string): { from: string; to: string } {
  const parts = month.split("-").map(Number);
  const year = parts[0] ?? 0;
  const monthNum = parts[1] ?? 1;
  const from = `${month}-01`;
  const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
  const nextYear = monthNum === 12 ? year + 1 : year;
  const to = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { from, to };
}
