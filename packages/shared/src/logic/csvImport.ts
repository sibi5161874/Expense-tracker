import { EXAMPLE_ROW_MARKER } from '../importTemplates';

export interface ImportRowError {
  row: number;
  reason: string;
}

/** Exact header match only — no fuzzy/partial matching, per the import spec. */
export function headersMatch(actual: string[], expected: readonly string[]): boolean {
  if (actual.length !== expected.length) return false;
  return expected.every((col, i) => (actual[i] ?? '').trim() === col);
}

/**
 * Maps CSV data rows (everything after the header row) to column-name-keyed records.
 * Rows whose first cell starts with the "EXAMPLE" marker are skipped (not errors).
 * `row` in each entry is the 1-indexed line number in the original file (header = row 1).
 */
export function rowsToRecords(
  rows: string[][],
  columns: readonly string[]
): { row: number; record: Record<string, string> }[] {
  const dataRows = rows.slice(1);
  const result: { row: number; record: Record<string, string> }[] = [];

  dataRows.forEach((cells, i) => {
    const rowNumber = i + 2;
    if ((cells[0] ?? '').trim().toUpperCase().startsWith(EXAMPLE_ROW_MARKER)) return;
    if (cells.every((c) => c.trim() === '')) return;

    const record: Record<string, string> = {};
    columns.forEach((col, idx) => {
      record[col] = (cells[idx] ?? '').trim();
    });
    result.push({ row: rowNumber, record });
  });

  return result;
}

/** Case-insensitive name -> id lookup map, for resolving human-readable account/category names. */
export function buildNameIndex(items: { id: string; name: string }[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of items) {
    map.set(item.name.trim().toLowerCase(), item.id);
  }
  return map;
}

export function resolveNameToId(index: Map<string, string>, name: string): { id: string } | { error: string } {
  if (!name) return { error: 'not provided' };
  const id = index.get(name.trim().toLowerCase());
  if (!id) return { error: `no match found for "${name}"` };
  return { id };
}

export function parseAmount(value: string): number | null {
  const n = Number(value);
  if (!value || Number.isNaN(n)) return null;
  return n;
}

export function normalizeDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null;
  return value.trim();
}
