import { z } from "zod";

export const investmentLogSchema = z.object({
  date: z.string().min(1, "Date is required"),
  symbol: z.string().min(1, "Symbol is required"),
  exchange: z.string().min(1, "Exchange is required"),
  action: z.enum(["BUY", "SELL", "SIP", "DIVIDEND", "BONUS", "SPLIT"]),
  quantity: z.number().nonnegative("Quantity must be non-negative"),
  price: z.number().nonnegative("Price must be non-negative"),
  fees: z.number().nonnegative("Fees must be non-negative"),
  bonus_split_extra_units: z.number().optional(),
  linked_account_id: z.string().uuid("Linked account is required"),
  asset_type: z.enum(["Stock", "ETF", "Mutual Fund", "Crypto", "Bond", "Other"]),
  notes: z.string().optional(),
});

export type InvestmentLogInput = z.infer<typeof investmentLogSchema>;
