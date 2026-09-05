import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from './route';

const { getUserMock, enforceRateLimitMock, getAccountsMock, getCategoriesMock, getTransactionsForDedupMock, createTransactionsBulkMock } =
  vi.hoisted(() => ({
    getUserMock: vi.fn(),
    enforceRateLimitMock: vi.fn().mockResolvedValue(null),
    getAccountsMock: vi.fn(),
    getCategoriesMock: vi.fn(),
    getTransactionsForDedupMock: vi.fn(),
    createTransactionsBulkMock: vi.fn(),
  }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: getUserMock } }),
}));
vi.mock('@/lib/rateLimit', () => ({ enforceRateLimit: enforceRateLimitMock }));
vi.mock('@repo/shared/queries/config', () => ({
  getAccounts: getAccountsMock,
  getCategories: getCategoriesMock,
}));
vi.mock('@repo/shared/queries/transactions', () => ({
  getTransactionsForDedup: getTransactionsForDedupMock,
  createTransactionsBulk: createTransactionsBulkMock,
}));

const HEADER = 'Date,Type,Category,Sub-Category,Amount,From Account,To Account,Notes';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/import/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/import/transactions', () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: 'user_1' } } });
    enforceRateLimitMock.mockClear().mockResolvedValue(null);
    getAccountsMock.mockReset().mockResolvedValue([{ id: 'a0000000-0000-4000-8000-000000000001', name: 'HDFC Bank' }]);
    getCategoriesMock.mockReset().mockResolvedValue([{ id: 'a0000000-0000-4000-8000-000000000002', name: 'Groceries' }]);
    getTransactionsForDedupMock.mockReset().mockResolvedValue([]);
    createTransactionsBulkMock.mockReset().mockResolvedValue([{ id: 'tx_1' }]);
  });

  it('returns 401 when there is no authenticated user', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest({ csv: HEADER, commit: false }));
    expect(res.status).toBe(401);
  });

  it('returns 413 when the file exceeds the 10MB size cap', async () => {
    const hugeCsv = HEADER + '\n' + 'x'.repeat(11 * 1024 * 1024);
    const res = await POST(makeRequest({ csv: hugeCsv }));
    expect(res.status).toBe(413);
    expect(createTransactionsBulkMock).not.toHaveBeenCalled();
  });

  it("rejects a file whose headers don't match the template exactly", async () => {
    const res = await POST(makeRequest({ csv: 'Wrong,Headers\nfoo,bar' }));
    expect(res.status).toBe(400);
    expect(createTransactionsBulkMock).not.toHaveBeenCalled();
  });

  it('previews without writing to the database when commit is not set', async () => {
    const csv = `${HEADER}\n2026-07-01,Expense,Groceries,,1500,HDFC Bank,,`;

    const res = await POST(makeRequest({ csv, commit: false }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.validCount).toBe(1);
    expect(body.committed).toBe(0);
    expect(createTransactionsBulkMock).not.toHaveBeenCalled();
  });

  it('commits valid rows and reports the real inserted count when commit is true', async () => {
    const csv = `${HEADER}\n2026-07-01,Expense,Groceries,,1500,HDFC Bank,,`;

    const res = await POST(makeRequest({ csv, commit: true }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.committed).toBe(1);
    expect(createTransactionsBulkMock).toHaveBeenCalledTimes(1);
  });

  it('flags a row referencing an account that does not exist as an error, not a silent drop', async () => {
    const csv = `${HEADER}\n2026-07-01,Expense,Groceries,,1500,Unknown Bank,,`;

    const res = await POST(makeRequest({ csv, commit: false }));

    const body = await res.json();
    expect(body.validCount).toBe(0);
    expect(body.errors.length).toBeGreaterThan(0);
  });

  it('never commits rows that failed validation, even when other rows in the same file are valid', async () => {
    const csv = [
      HEADER,
      '2026-07-01,Expense,Groceries,,1500,HDFC Bank,,',
      '2026-07-02,Expense,Groceries,,2000,Unknown Bank,,',
    ].join('\n');

    const res = await POST(makeRequest({ csv, commit: true }));

    const body = await res.json();
    expect(body.committed).toBe(1);
    expect(body.errors.length).toBe(1);
    // Only the one valid row is ever handed to the DB write.
    expect(createTransactionsBulkMock).toHaveBeenCalledWith(expect.anything(), 'user_1', expect.arrayContaining([]));
    expect(createTransactionsBulkMock.mock.calls[0]![2]).toHaveLength(1);
  });

  it('excludes a row that duplicates an existing transaction from both validCount and the commit', async () => {
    getTransactionsForDedupMock.mockResolvedValue([
      { date: '2026-07-01', category_id: 'a0000000-0000-4000-8000-000000000002', amount: 1500 },
    ]);
    const csv = `${HEADER}\n2026-07-01,Expense,Groceries,,1500,HDFC Bank,,`;

    const res = await POST(makeRequest({ csv, commit: true }));

    const body = await res.json();
    expect(body.duplicateCount).toBe(1);
    expect(body.validCount).toBe(0);
    expect(createTransactionsBulkMock).not.toHaveBeenCalled();
  });
});
