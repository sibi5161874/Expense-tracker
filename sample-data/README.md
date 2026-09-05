# Sample data

Test fixtures for exercising the app's bulk-import flows. Not part of the build — safe to
delete or regenerate at any time.

| File | Rows | Import via |
|---|---|---|
| `transactions.csv` | 60 | Transactions page → Import |
| `cashbook.csv` | 30 | Cashbook page → Import |
| `investment-log.csv` | 100 | Investments page → Import |

## Before importing

The transaction/cashbook/investment CSVs reference accounts by name — `HDFC Bank`,
`ICICI Bank`, `Cash` (transactions/cashbook) and `Zerodha`, `Upstox` (investment log) — and
transactions reference categories by name (`Groceries`, `Rent`, `Salary`, `Transport`,
`Utilities`, `Dining`, `Shopping`, `Healthcare`, `Entertainment`). Import matches these by
exact name, so either:
