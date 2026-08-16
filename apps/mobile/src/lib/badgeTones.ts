export type BadgeTone = "success" | "destructive" | "warning" | "info" | "neutral";

/** Ported from apps/web/src/lib/badgeTones.ts — presentation-layer mapping, not shared business logic. */
export function transactionTypeTone(type: string): BadgeTone {
  if (type === "Income") return "success";
  if (type === "Expense") return "destructive";
  return "info";
}

export function budgetStatusTone(status: string): BadgeTone {
  if (status === "over") return "destructive";
  if (status === "warning") return "warning";
  return "success";
}

export function investmentActionTone(action: string): BadgeTone {
  if (action === "BUY" || action === "SIP") return "success";
  if (action === "SELL") return "destructive";
  return "info";
}

export function goalStatusTone(status: string): BadgeTone {
  if (status === "Achieved") return "success";
  if (status === "Overdue") return "destructive";
  if (status === "On Track") return "info";
  return "warning";
}

export function cashbookFlowTone(flow: string): BadgeTone {
  return flow === "Gave" ? "info" : "success";
}

export function fixedDepositStatusTone(status: string): BadgeTone {
  if (status === "Active") return "info";
  if (status === "Matured") return "success";
  if (status === "Maturing Soon") return "warning";
  return "neutral";
}

export function premiumStatusTone(status: string): BadgeTone {
  if (status === "Overdue") return "destructive";
  if (status === "Due Soon") return "warning";
  return "neutral";
}
