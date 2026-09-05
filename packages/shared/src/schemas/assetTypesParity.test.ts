import { describe, expect, it } from "vitest";
import {
  assetFixedDepositSchema,
  assetGoldSchema,
  assetLoanLiabilitySchema,
  assetEpfSchema,
  assetNpsSchema,
  assetSsySchema,
  assetSgbSchema,
  assetUlipSchema,
  assetRealEstateSchema,
  assetPpfSchema,
  assetRecurringDepositSchema,
  assetNscSchema,
  assetVehicleSchema,
} from "./index";

/**
 * Both apps' useAssets.ts hooks are built on the same 13 asset-type schemas from this
 * package (see createAssetHook's queries.create/update, typed against each *Input type).
 * A schema going missing here is a compile error in both apps already — this test is a
 * runtime canary that the set itself stays at exactly 13, so a silent count drift (an asset
 * type quietly dropped from this list) fails loudly instead of just shrinking a union type.
 *
 * Note: this intentionally does NOT assert web's and mobile's tab-key *strings* are
 * identical — they aren't (mobile uses `realEstate`/`recurringDeposits`,
 * apps/web/src/components/assets/AssetFormHost.tsx uses `realestate`/`rd`), and unifying
 * those would mean renaming keys used elsewhere in mobile's routing/state. That's a
 * separate, deliberate follow-up, not something to fix by silent rename here.
 */
describe("asset type schema parity", () => {
  const schemas = [
    assetFixedDepositSchema,
    assetGoldSchema,
    assetLoanLiabilitySchema,
    assetEpfSchema,
    assetNpsSchema,
    assetSsySchema,
    assetSgbSchema,
    assetUlipSchema,
    assetRealEstateSchema,
    assetPpfSchema,
    assetRecurringDepositSchema,
    assetNscSchema,
    assetVehicleSchema,
  ];

  it("exposes exactly 13 asset-type schemas", () => {
    expect(schemas).toHaveLength(13);
  });

  it("every asset schema is a real, usable Zod schema", () => {
    for (const schema of schemas) {
      expect(typeof schema.safeParse).toBe("function");
    }
  });
});
