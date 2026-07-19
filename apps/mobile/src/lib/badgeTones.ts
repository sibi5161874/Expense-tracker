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
