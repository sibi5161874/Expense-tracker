import type { Database } from "./database.types";

export * from "./database.types";

export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type BudgetLimit = Database["public"]["Tables"]["budget_limits"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type InvestmentLogEntry = Database["public"]["Tables"]["investment_log"]["Row"];
export type Holding = Database["public"]["Tables"]["holdings"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type CashbookEntry = Database["public"]["Tables"]["cashbook"]["Row"];
export type FixedDeposit = Database["public"]["Tables"]["assets_fixed_deposits"]["Row"];
export type GoldAsset = Database["public"]["Tables"]["assets_gold"]["Row"];
export type LoanLiability = Database["public"]["Tables"]["assets_loans_liabilities"]["Row"];
export type EpfAsset = Database["public"]["Tables"]["assets_epf"]["Row"];
export type NpsAsset = Database["public"]["Tables"]["assets_nps"]["Row"];
export type SsyAsset = Database["public"]["Tables"]["assets_ssy"]["Row"];
export type SgbAsset = Database["public"]["Tables"]["assets_sgb"]["Row"];
export type UlipAsset = Database["public"]["Tables"]["assets_ulip"]["Row"];
export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type InsurancePolicy = Database["public"]["Tables"]["insurance_policies"]["Row"];
