/**
 * Calculate cashbook entry status
 * Business rule from DATA_MODEL.md section 5
 */
export function calculateCashbookEntryStatus(
  dueDate: string | null,
  netBalanceForCounterparty: number
): 'OVERDUE' | 'OK' {
  if (!dueDate) return 'OK';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  // Overdue if due date passed AND counterparty still owes money (positive net balance)
  if (due < today && netBalanceForCounterparty > 0) {
    return 'OVERDUE';
  }
  
  return 'OK';
}

/**
 * Calculate cashbook summary for a counterparty
 * Business rule from DATA_MODEL.md section 5
 */
export interface CashbookSummary {
  counterparty: string;
  totalGiven: number;
  totalReceived: number;
  netBalance: number;
  summaryText: string;
  hasOverdue: boolean;
}

export function calculateCashbookSummary(
  entries: Array<{
    counterparty: string;
    flow: 'Gave' | 'Received';
    amount: number;
    dueDate: string | null;
  }>
): Record<string, CashbookSummary> {
  const summary: Record<string, CashbookSummary> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const entry of entries) {
    if (!summary[entry.counterparty]) {
      summary[entry.counterparty] = {
        counterparty: entry.counterparty,
        totalGiven: 0,
        totalReceived: 0,
        netBalance: 0,
        summaryText: '',
        hasOverdue: false,
      };
    }
    
    const counterpartySummary = summary[entry.counterparty];
    if (!counterpartySummary) continue;
    
    if (entry.flow === 'Gave') {
      counterpartySummary.totalGiven += entry.amount;
      if (entry.dueDate) {
        const due = new Date(entry.dueDate);
        due.setHours(0, 0, 0, 0);
        if (due < today) {
          counterpartySummary.hasOverdue = true;
        }
      }
    } else {
      counterpartySummary.totalReceived += entry.amount;
    }
    
    counterpartySummary.netBalance = counterpartySummary.totalGiven - counterpartySummary.totalReceived;
    
    if (counterpartySummary.netBalance > 0) {
      counterpartySummary.summaryText = `${entry.counterparty} owes you ₹${counterpartySummary.netBalance.toFixed(2)}`;
    } else if (counterpartySummary.netBalance < 0) {
      counterpartySummary.summaryText = `You owe ${entry.counterparty} ₹${Math.abs(counterpartySummary.netBalance).toFixed(2)}`;
    } else {
      counterpartySummary.summaryText = `Settled with ${entry.counterparty}`;
    }
  }
  
  return summary;
}
