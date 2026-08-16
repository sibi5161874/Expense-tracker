import { z } from "zod";

export const netWorthSnapshotSchema = z.object({
  snapshot_date: z.string().min(1, "Date is required"),
  cash_and_bank_total: z.number(),
  fixed_deposits_total: z.number(),
  gold_total: z.number(),
  epf_total: z.number(),
  nps_total: z.number(),
  ssy_total: z.number(),
  sgb_total: z.number(),
  ulip_total: z.number(),
  real_estate_total: z.number(),
  ppf_total: z.number(),
  recurring_deposits_total: z.number(),
  nsc_total: z.number(),
  vehicles_total: z.number(),
  portfolio_value: z.number(),
  liabilities_total: z.number(),
  net_worth: z.number(),
  notes: z.string().optional(),
});

export type NetWorthSnapshotInput = z.infer<typeof netWorthSnapshotSchema>;
