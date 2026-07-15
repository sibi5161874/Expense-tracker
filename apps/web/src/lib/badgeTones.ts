import type { BadgeTone } from "@/components/shared/StatusBadge";

export function transactionTypeTone(type: string): BadgeTone {
  if (type === "Income") return "success";
  if (type === "Expense") return "destructive";
  return "info";
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

export function fixedDepositStatusTone(status: string): BadgeTone {
  if (status === "Active") return "info";
  if (status === "Matured") return "success";
  if (status === "Maturing Soon") return "warning";
  return "neutral";
}

export function cashbookFlowTone(flow: string): BadgeTone {
  return flow === "Gave" ? "info" : "success";
}
