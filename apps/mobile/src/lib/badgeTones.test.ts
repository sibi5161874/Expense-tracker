import {
  transactionTypeTone,
  budgetStatusTone,
  investmentActionTone,
  goalStatusTone,
  cashbookFlowTone,
} from "./badgeTones";

describe("badgeTones", () => {
  it("maps transaction types to tones, falling back to info", () => {
    expect(transactionTypeTone("Income")).toBe("success");
    expect(transactionTypeTone("Expense")).toBe("destructive");
    expect(transactionTypeTone("Transfer")).toBe("info");
  });

  it("treats an over-budget status as destructive and warning as warning", () => {
    expect(budgetStatusTone("over")).toBe("destructive");
    expect(budgetStatusTone("warning")).toBe("warning");
    expect(budgetStatusTone("ok")).toBe("success");
  });

  it("groups SIP with BUY as a success-toned action", () => {
    expect(investmentActionTone("BUY")).toBe("success");
    expect(investmentActionTone("SIP")).toBe("success");
    expect(investmentActionTone("SELL")).toBe("destructive");
  });

  it("distinguishes every goal status, defaulting to warning", () => {
    expect(goalStatusTone("Achieved")).toBe("success");
    expect(goalStatusTone("Overdue")).toBe("destructive");
    expect(goalStatusTone("On Track")).toBe("info");
    expect(goalStatusTone("Behind")).toBe("warning");
  });

  it("tones cashbook flows by direction", () => {
    expect(cashbookFlowTone("Gave")).toBe("info");
    expect(cashbookFlowTone("Got")).toBe("success");
  });
});
