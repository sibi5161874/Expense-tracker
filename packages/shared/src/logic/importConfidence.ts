/**
 * Whether an import needs an explicit "I checked this" acknowledgment before
 * committing. Only an exact match against a `verified` institution (see
 * institutions.ts) is trusted without one — everything else (heuristic
 * detection, a `partial`-confidence institution, or a manually-typed mapping)
 * has never been confirmed against a real file from that institution and
 * requires the user to say they reviewed the preview first.
 *
 * This exists because bank statements can self-check against their own
 * balance column (see checkBalanceReconciliation in bankStatementImport.ts),
 * but broker tradebooks carry no running total to verify against — there is
 * no automated check possible for 15 of the 18 listed brokers. This
 * acknowledgment step is the only safeguard available for those.
 */
export type MappingSource = 'exact' | 'heuristic' | 'manual';
export type InstitutionConfidence = 'verified' | 'partial' | 'heuristic' | null;

export function needsReviewAcknowledgement(
  mappingSource: MappingSource,
  institutionConfidence: InstitutionConfidence
): boolean {
  return !(mappingSource === 'exact' && institutionConfidence === 'verified');
}
