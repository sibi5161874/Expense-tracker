import { z } from "zod";

export const assetCryptoSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  name: z.string().optional().nullable(),
  quantity: z.number().positive("Quantity must be greater than 0"),
  buy_price: z.number().nonnegative("Buy price must be non-negative"),
  current_price: z.number().nonnegative("Current price must be non-negative"),
  wallet_or_exchange: z.string().optional().nullable(),
  purchase_date: z.string().min(1, "Purchase date is required"),
  notes: z.string().optional().nullable(),
});

export type AssetCryptoInput = z.infer<typeof assetCryptoSchema>;
