import { z } from "zod";

/** Every CSV import route shares this shape at minimum — `commit` toggles preview vs. actual
 * insert, matching the client's two-step "preview then confirm" import flow. Used as-is by
 * the cashbook, investment-log, and transactions import routes; extended below for the two
 * routes that also need an account to post into. */
export const importCsvSchema = z.object({
  csv: z.string().min(1),
  commit: z.boolean().optional(),
});

export type ImportCsvInput = z.infer<typeof importCsvSchema>;

/** `mapping` is only shape-checked here (an object, or absent) — its actual column names are
 * deep-validated against the file's real headers separately in the route itself, since that
 * check needs the parsed CSV's header row, which isn't available at the request-body-schema
 * stage. */
export const bankStatementImportSchema = importCsvSchema.extend({
  account_id: z.string().min(1),
  bank: z.string().optional(),
  mapping: z.record(z.string(), z.unknown()).optional(),
  /** Seeds the running-balance reconciliation chain across a chunked commit — the previous
   * chunk's returned `reconciliation.lastBalance`. Absent (or null) means "start fresh", the
   * correct behavior for a whole-file preview or the first chunk of a commit. */
  previous_balance: z.number().nullable().optional(),
});

export type BankStatementImportInput = z.infer<typeof bankStatementImportSchema>;

export const brokerImportSchema = importCsvSchema.extend({
  linked_account_id: z.string().min(1),
  broker: z.string().optional(),
  mapping: z.record(z.string(), z.unknown()).optional(),
});

export type BrokerImportInput = z.infer<typeof brokerImportSchema>;
