/** Field configs for AssetForm, one per asset sub-type — kept separate from the screen
 * so the screen component itself stays small per RULES.md §12. */

export const FD_FIELDS = [
  { name: "bank", label: "Bank", type: "text" },
  { name: "principal", label: "Principal", type: "number" },
  { name: "maturity_value", label: "Maturity Value", type: "number" },
  { name: "maturity_date", label: "Maturity Date", type: "date" },
  { name: "rate_pct", label: "Interest Rate %", type: "number" },
  { name: "withdrawn", label: "Withdrawn", type: "boolean" },
] as const;

export const GOLD_FIELDS = [
  { name: "description", label: "Description", type: "text" },
  { name: "grams", label: "Grams", type: "number" },
  { name: "rate_per_gram", label: "Rate per Gram", type: "number" },
  { name: "purchase_value", label: "Purchase Value", type: "number" },
] as const;

export const LOAN_FIELDS = [
  { name: "lender", label: "Lender", type: "text" },
  { name: "outstanding", label: "Outstanding", type: "number" },
  { name: "emi", label: "EMI", type: "number", optional: true },
  { name: "interest_rate_pct", label: "Interest Rate %", type: "number", optional: true },
  { name: "months_left", label: "Months Left", type: "number", optional: true },
  { name: "notes", label: "Notes", type: "text", optional: true },
] as const;

export const EPF_FIELDS = [
  { name: "employer_name", label: "Employer Name", type: "text" },
  { name: "current_balance", label: "Current Balance", type: "number" },
  { name: "monthly_contribution", label: "Monthly Contribution", type: "number" },
  { name: "uan_number", label: "UAN Number", type: "text", optional: true },
] as const;

export const NPS_FIELDS = [
  { name: "pran_number", label: "PRAN Number", type: "text" },
  { name: "current_value", label: "Current Value", type: "number" },
  { name: "tier", label: "Tier", type: "enum", options: ["Tier I", "Tier II"] },
] as const;

export const SSY_FIELDS = [
  { name: "account_holder_name", label: "Account Holder Name", type: "text" },
  { name: "account_number", label: "Account Number", type: "text" },
  { name: "current_balance", label: "Current Balance", type: "number" },
  { name: "opening_date", label: "Opening Date", type: "date" },
] as const;

export const SGB_FIELDS = [
  { name: "units_held", label: "Units Held", type: "number" },
  { name: "issue_price", label: "Issue Price", type: "number" },
  { name: "issue_date", label: "Issue Date", type: "date" },
  { name: "rate_per_gram", label: "Rate per Gram", type: "number" },
] as const;

export const ULIP_FIELDS = [
  { name: "insurer", label: "Insurer", type: "text" },
  { name: "policy_number", label: "Policy Number", type: "text" },
  { name: "sum_assured", label: "Sum Assured", type: "number" },
  { name: "current_fund_value", label: "Current Fund Value", type: "number" },
  { name: "premium_amount", label: "Premium Amount", type: "number" },
  {
    name: "premium_frequency",
    label: "Premium Frequency",
    type: "enum",
    options: ["Monthly", "Quarterly", "Half-Yearly", "Yearly"],
  },
  { name: "maturity_date", label: "Maturity Date", type: "date" },
] as const;

export const REAL_ESTATE_FIELDS = [
  { name: "description", label: "Description", type: "text" },
  { name: "property_type", label: "Property Type", type: "enum", options: ["Residential", "Commercial", "Land", "Other"] },
  { name: "location", label: "Location", type: "text", optional: true },
  { name: "purchase_value", label: "Purchase Value", type: "number" },
  { name: "current_value", label: "Current Value", type: "number" },
  { name: "purchase_date", label: "Purchase Date", type: "date" },
] as const;

export const PPF_FIELDS = [
  { name: "account_number", label: "Account Number", type: "text" },
  { name: "current_balance", label: "Current Balance", type: "number" },
  { name: "annual_contribution", label: "Annual Contribution", type: "number" },
  { name: "opening_date", label: "Opening Date", type: "date" },
] as const;

export const RECURRING_DEPOSIT_FIELDS = [
  { name: "bank", label: "Bank", type: "text" },
  { name: "monthly_installment", label: "Monthly Installment", type: "number" },
  { name: "rate_pct", label: "Interest Rate %", type: "number" },
  { name: "start_date", label: "Start Date", type: "date" },
  { name: "maturity_date", label: "Maturity Date", type: "date" },
  { name: "maturity_value", label: "Maturity Value", type: "number" },
] as const;

export const NSC_FIELDS = [
  { name: "certificate_number", label: "Certificate Number", type: "text" },
  { name: "purchase_value", label: "Purchase Value", type: "number" },
  { name: "maturity_value", label: "Maturity Value", type: "number" },
  { name: "rate_pct", label: "Interest Rate %", type: "number" },
  { name: "purchase_date", label: "Purchase Date", type: "date" },
  { name: "maturity_date", label: "Maturity Date", type: "date" },
] as const;

export const VEHICLE_FIELDS = [
  { name: "description", label: "Description", type: "text" },
  { name: "vehicle_type", label: "Vehicle Type", type: "enum", options: ["Car", "Two Wheeler", "Commercial", "Other"] },
  { name: "registration_number", label: "Registration Number", type: "text", optional: true },
  { name: "purchase_value", label: "Purchase Value", type: "number" },
  { name: "current_value", label: "Current Value", type: "number" },
  { name: "purchase_date", label: "Purchase Date", type: "date" },
] as const;
