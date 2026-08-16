export const ASSET_TABS = [
  { key: "fd", label: "Fixed Deposits" },
  { key: "gold", label: "Gold" },
  { key: "loans", label: "Loans" },
  { key: "epf", label: "EPF" },
  { key: "nps", label: "NPS" },
  { key: "ssy", label: "SSY" },
  { key: "sgb", label: "SGB" },
  { key: "ulip", label: "ULIP" },
] as const;

export type AssetTabKey = (typeof ASSET_TABS)[number]["key"];
