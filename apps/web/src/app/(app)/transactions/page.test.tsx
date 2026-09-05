import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionsPage from './page';

const { push, toastFn } = vi.hoisted(() => ({
  push: vi.fn(),
  toastFn: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));
vi.mock('sonner', () => ({ toast: toastFn }));

vi.mock('@/hooks/useEntitlements', () => ({
  useEntitlements: () => ({ hasFeature: () => true }),
}));

vi.mock('@/components/TransactionForm', () => ({ TransactionForm: () => null }));
vi.mock('@/components/shared/ImportDialog', () => ({ ImportDialog: () => null }));
vi.mock('@/components/shared/BankStatementImportDialog', () => ({ BankStatementImportDialog: () => null }));
vi.mock('@/components/transactions/TransactionsCalendarView', () => ({ TransactionsCalendarView: () => null }));

const { rows, deleteTransaction, createTransaction, createTransactionsBulk, deleteTransactionsBulk } = vi.hoisted(
  () => ({
    rows: [
      {
        id: 'tx-1',
        date: '2026-08-01',
        type: 'Expense',
        amount: 500,
        from_account_id: 'acc-1',
        to_account_id: null,
        category_id: 'cat-1',
        sub_category: null,
        notes: 'Groceries',
        category: { name: 'Food' },
        from_account: { name: 'Checking' },
      },
      {
        id: 'tx-2',
        date: '2026-08-02',
        type: 'Income',
        amount: 2000,
        from_account_id: 'acc-1',
        to_account_id: null,
        category_id: 'cat-2',
        sub_category: null,
        notes: 'Salary',
        category: { name: 'Salary' },
        from_account: { name: 'Checking' },
      },
    ],
    deleteTransaction: vi.fn(),
    createTransaction: vi.fn().mockResolvedValue(undefined),
    createTransactionsBulk: vi.fn().mockResolvedValue(undefined),
    deleteTransactionsBulk: vi.fn().mockResolvedValue(undefined),
  })
);

vi.mock('@/hooks/useTransactions', () => ({
  useTransactions: () => ({
    data: rows,
    isLoading: false,
    error: null,
    createTransaction,
    createTransactionsBulk,
    deleteTransaction,
    deleteTransactionsBulk,
    isDeleting: false,
  }),
}));

describe('TransactionsPage delete/undo', () => {
  beforeEach(() => {
    deleteTransaction.mockClear();
    createTransaction.mockClear();
    createTransactionsBulk.mockClear();
    deleteTransactionsBulk.mockClear();
    toastFn.mockClear();
  });

  it('deletes a single row and restores its exact fields when Undo is clicked', async () => {
    const user = userEvent.setup();
    render(<TransactionsPage />);

    await user.click(screen.getAllByRole('button', { name: 'Delete transaction' })[0]!);
    const dialog = await screen.findByRole('dialog', { name: /Delete transaction\?/ });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(deleteTransaction).toHaveBeenCalledWith('tx-1');

    const undoCall = toastFn.mock.calls.find(([, opts]) => opts?.action?.label === 'Undo');
    expect(undoCall).toBeDefined();
    undoCall![1].action.onClick();

    expect(createTransaction).toHaveBeenCalledWith({
      date: '2026-08-01',
      type: 'Expense',
      amount: 500,
      from_account_id: 'acc-1',
      category_id: 'cat-1',
      sub_category: undefined,
      to_account_id: undefined,
      notes: 'Groceries',
    });
  });

  it('bulk-deletes selected rows and restores all of them via Undo', async () => {
    const user = userEvent.setup();
    render(<TransactionsPage />);

    const table = screen.getByRole('table');
    const checkboxes = within(table).getAllByRole('checkbox', { name: 'Select row' });
    await user.click(checkboxes[0]!);
    await user.click(checkboxes[1]!);

    await user.click(screen.getByRole('button', { name: /Delete selected/ }));
    const dialog = await screen.findByRole('dialog', { name: /Delete 2 transactions\?/ });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(deleteTransactionsBulk).toHaveBeenCalledWith(['tx-1', 'tx-2']);

    const undoCall = toastFn.mock.calls.find(([, opts]) => opts?.action?.label === 'Undo');
    expect(undoCall).toBeDefined();
    undoCall![1].action.onClick();

    expect(createTransactionsBulk).toHaveBeenCalledWith([
      {
        date: '2026-08-01',
        type: 'Expense',
        amount: 500,
        from_account_id: 'acc-1',
        category_id: 'cat-1',
        sub_category: undefined,
        to_account_id: undefined,
        notes: 'Groceries',
      },
      {
        date: '2026-08-02',
        type: 'Income',
        amount: 2000,
        from_account_id: 'acc-1',
        category_id: 'cat-2',
        sub_category: undefined,
        to_account_id: undefined,
        notes: 'Salary',
      },
    ]);
  });
});
