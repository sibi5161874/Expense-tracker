import { z } from "zod";

/** One dividend the user confirmed in the bank-statement import review step — see
 * DividendReviewList.tsx. The server fills in the rest of investmentLogSchema's shape
 * (action: 'DIVIDEND', quantity: 0, fees: 0, price: amount) since those are fixed for every
 * dividend entry, not something the review UI needs to ask about. */
export const dividendEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  symbol: z.string().min(1, "Symbol is required"),
  exchange: z.string().min(1, "Exchange is required"),
  linked_account_id: z.string().uuid("Linked account is required"),
  asset_type: z.enum(["Stock", "ETF", "Mutual Fund", "Crypto", "Bond", "Other"]),
  notes: z.string().optional(),
});

export type DividendEntryInput = z.infer<typeof dividendEntrySchema>;

export const dividendImportSchema = z.object({
  entries: z.array(dividendEntrySchema).min(1),
});

export type DividendImportInput = z.infer<typeof dividendImportSchema>;
