import type { RecurringFrequency } from '../types';

const MAX_CATCH_UP_OCCURRENCES = 24;

function parseDate(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number);
  return { year: year ?? 0, month: month ?? 1, day: day ?? 1 };
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Advances a "YYYY-MM-DD" date by one occurrence of `frequency`, using UTC-only
 * date-component arithmetic (never the local Date constructor) so results don't
 * shift with the runtime's timezone. Monthly/Quarterly/Yearly clamp the day to
 * the target month's last day — Jan 31 + 1 month lands on Feb 28/29, not Mar 3.
 */
export function computeNextRunDate(date: string, frequency: RecurringFrequency): string {
  const { year, month, day } = parseDate(date);

  if (frequency === 'Weekly') {
    const next = new Date(Date.UTC(year, month - 1, day + 7));
    return formatDate(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
  }

  const monthsToAdd = frequency === 'Monthly' ? 1 : frequency === 'Quarterly' ? 3 : 12;
  const totalMonths = month - 1 + monthsToAdd;
  const nextYear = year + Math.floor(totalMonths / 12);
  const nextMonth = (totalMonths % 12) + 1;
  const clampedDay = Math.min(day, daysInMonth(nextYear, nextMonth));
  return formatDate(nextYear, nextMonth, clampedDay);
}

export interface DueOccurrences {
  /** One date per transaction that should be generated, oldest first. */
  occurrenceDates: string[];
  /** Where next_run_date should be set to after generating the above. */
  nextRunDate: string;
}

/**
 * Walks a recurring rule forward from its current `nextRunDate` to `asOfDate`,
 * collecting every occurrence that's come due (handles catching up after the
 * app hasn't been opened for a while, e.g. 3 missed months = 3 transactions).
 * Capped at MAX_CATCH_UP_OCCURRENCES so a stale/corrupt rule can't loop forever.
 */
export function getDueOccurrences(
  nextRunDate: string,
  frequency: RecurringFrequency,
  asOfDate: string
): DueOccurrences {
  const occurrenceDates: string[] = [];
  let current = nextRunDate;

  while (current <= asOfDate && occurrenceDates.length < MAX_CATCH_UP_OCCURRENCES) {
    occurrenceDates.push(current);
    current = computeNextRunDate(current, frequency);
  }

  return { occurrenceDates, nextRunDate: current };
}
