export const ASSET_TABS = [
  { key: "fd", label: "Fixed Deposits" },
  { key: "gold", label: "Gold" },
  { key: "loans", label: "Loans" },
  { key: "epf", label: "EPF" },
  { key: "nps", label: "NPS" },
  { key: "ssy", label: "SSY" },
  { key: "sgb", label: "SGB" },
  { key: "ulip", label: "ULIP" },
  { key: "realEstate", label: "Real Estate" },
  { key: "ppf", label: "PPF" },
  { key: "recurringDeposits", label: "Recurring Deposits" },
  { key: "nsc", label: "NSC" },
  { key: "vehicles", label: "Vehicles" },
  { key: "crypto", label: "Crypto" },
] as const;

export type AssetTabKey = (typeof ASSET_TABS)[number]["key"];

