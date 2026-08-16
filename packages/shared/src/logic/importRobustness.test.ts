import { describe, expect, it } from 'vitest';
import { parseCsv } from '../utils/csv';
import { rowsToRecords, parseAmount } from './csvImport';
import { resolveBankMapping, buildBankStatementImportPlan, parseBankDate } from './bankStatementImport';

/**
 * Adversarial robustness tests for the statement import pipeline.
 *
 * These deliberately do NOT assert "a realistic HDFC file parses correctly" —
 * those fixtures would be written from the same assumptions the parser was
 * built from, so they'd pass by construction and prove nothing (the AMFI bug,
 * a "-" placeholder nobody predicted, is the standing example).
 *
 * Instead each case is a hostile-but-plausible malformation that a real export
 * could contain: encoding artefacts, locale-specific number formats, structural
 * noise. The goal is to find places the parser breaks on shapes I did not
 * anticipate, rather than to confirm shapes I did.
 */

const ACCOUNT = '11111111-1111-4111-8111-111111111111';

/** Runs raw file text through the full pipeline the API route uses. */
function importFile(text: string) {
  const rows = parseCsv(text);
  const headers = rows[0]!.map((h) => h.trim());
  const { mapping, unresolved } = resolveBankMapping(headers);
  if (!mapping) return { mapping: null, unresolved, plan: null };
  const records = rowsToRecords(rows, headers);
  return { mapping, unresolved, plan: buildBankStatementImportPlan(mapping, records, ACCOUNT, new Map(), []) };
}

describe('encoding and structural artefacts', () => {
  it('handles a UTF-8 BOM at the start of the file', () => {
    // Windows-exported bank CSVs very often carry a BOM, which would otherwise
    // corrupt the first header ("Date" -> "﻿Date") and break detection.
    const text = '﻿Date,Narration,Withdrawal,Deposit\n05/03/2026,SWIGGY,500,\n';
    const { mapping, plan } = importFile(text);
    expect(mapping).not.toBeNull();
    expect(plan!.validRows).toHaveLength(1);
  });

  it('handles CRLF line endings', () => {
    const text = 'Date,Narration,Withdrawal,Deposit\r\n05/03/2026,SWIGGY,500,\r\n';
    expect(importFile(text).plan!.validRows).toHaveLength(1);
  });

  it('handles quoted descriptions containing commas', () => {
    const text = 'Date,Narration,Withdrawal,Deposit\n05/03/2026,"SWIGGY, BANGALORE, IN",500,\n';
    const { plan } = importFile(text);
    expect(plan!.validRows[0]?.notes).toBe('SWIGGY, BANGALORE, IN');
  });

  it('skips blank rows scattered through the file', () => {
    const text = 'Date,Narration,Withdrawal,Deposit\n\n05/03/2026,SWIGGY,500,\n\n06/03/2026,UBER,200,\n';
    expect(importFile(text).plan!.validRows).toHaveLength(2);
  });

  it('tolerates trailing whitespace and mixed casing in headers', () => {
    const text = '  DATE  ,  narration  ,  Withdrawal  ,  DEPOSIT  \n05/03/2026,SWIGGY,500,\n';
    const { mapping, plan } = importFile(text);
    expect(mapping).not.toBeNull();
    expect(plan!.validRows).toHaveLength(1);
  });
});

describe('locale-specific amount formats', () => {
  // Indian statements group digits as 1,50,000.00 (lakh/crore), not 150,000.00.
  it.each([
    ['1,50,000.00', 150000],
    ['150,000.00', 150000],
    ['1,000', 1000],
    ['₹500', 500],
    ['INR 500', 500],
    ['500.50', 500.5],
    ['  500  ', 500],
    ['1,23,45,678.90', 12345678.9],
  ])('parses the amount %s as %d', (input, want) => {
    expect(parseAmount(input)).toBe(want);
  });

  it.each(['', '   ', 'N.A.', '-', 'abc', 'NIL', '..'])('rejects the non-numeric amount "%s"', (input) => {
    expect(parseAmount(input)).toBeNull();
  });

  it.each([
    ['(500)', -500],
    ['(1,50,000.00)', -150000],
    ['-500', -500],
  ])('treats %s as the negative amount %d (accounting notation)', (input, want) => {
    expect(parseAmount(input)).toBe(want);
  });

  it('imports a row whose amount carries Indian digit grouping', () => {
    const text = 'Date,Narration,Withdrawal,Deposit\n05/03/2026,RENT,"1,50,000.00",\n';
    const { plan } = importFile(text);
    expect(plan!.validRows[0]?.amount).toBe(150000);
  });
});

describe('date format variance', () => {
  it.each([
    ['05/03/2026', '2026-03-05'],
    ['05-03-2026', '2026-03-05'],
    ['05/03/26', '2026-03-05'],
    ['2026-03-05', '2026-03-05'],
    ['05/03/2026 14:32:00', '2026-03-05'],
    ['2026-03-05 09:20:00', '2026-03-05'],
  ])('parses %s', (input, want) => {
    expect(parseBankDate(input)).toBe(want);
  });

  it('rejects an ambiguous or malformed date rather than inventing one', () => {
    expect(parseBankDate('March 5 2026')).toBeNull();
    expect(parseBankDate('40/13/2026')).toBeNull();
  });
});

describe('structural noise real statements contain', () => {
  it('skips an opening-balance row that has no debit or credit', () => {
    const text =
      'Date,Narration,Withdrawal,Deposit\n01/03/2026,OPENING BALANCE,,\n05/03/2026,SWIGGY,500,\n';
    const { plan } = importFile(text);
    expect(plan!.validRows).toHaveLength(1);
    expect(plan!.errors).toEqual([]);
  });

  it('reports a footer/summary row as an error rather than importing garbage', () => {
    const text =
      'Date,Narration,Withdrawal,Deposit\n05/03/2026,SWIGGY,500,\nTOTAL,,500,0\n';
    const { plan } = importFile(text);
    expect(plan!.validRows).toHaveLength(1);
    // "TOTAL" is not a date, so it surfaces as a row error the user can see.
    expect(plan!.errors).toHaveLength(1);
  });

  it('handles a row with fewer columns than the header', () => {
    const text = 'Date,Narration,Withdrawal,Deposit\n05/03/2026,SWIGGY\n';
    // Missing amount columns => no debit/credit => treated as a noise row, not a crash.
    expect(() => importFile(text)).not.toThrow();
  });

  it('handles a row with more columns than the header', () => {
    const text = 'Date,Narration,Withdrawal,Deposit\n05/03/2026,SWIGGY,500,,EXTRA\n';
    const { plan } = importFile(text);
    expect(plan!.validRows).toHaveLength(1);
  });

  it('does not crash on a header-only file', () => {
    const { plan } = importFile('Date,Narration,Withdrawal,Deposit\n');
    expect(plan!.validRows).toEqual([]);
  });
});
