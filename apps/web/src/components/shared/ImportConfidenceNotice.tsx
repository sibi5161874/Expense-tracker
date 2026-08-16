'use client';

import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { needsReviewAcknowledgement, type MappingSource, type InstitutionConfidence } from '@repo/shared/logic';
import { Checkbox } from '@/components/ui/checkbox';

export { needsReviewAcknowledgement };
export type { MappingSource, InstitutionConfidence };

interface ImportConfidenceNoticeProps {
  institutionLabel: string;
  mappingSource: MappingSource;
  institutionConfidence: InstitutionConfidence;
  acknowledged: boolean;
  onAcknowledgedChange: (value: boolean) => void;
}

/**
 * Only HDFC, SBI, and Zerodha have been cross-verified against multiple
 * documented sources — everything else (15 of 18 brokers, most banks) is
 * detected purely by column-name heuristics and has never been checked
 * against a real downloaded file. Bank statements self-check against their
 * own balance column (see checkBalanceReconciliation); broker tradebooks
 * have no equivalent — a trade log carries no running total to verify
 * against, so there is no automated check available for them at all.
 *
 * This is the honesty mechanism for that gap: an import that isn't
 * fully verified requires the user to explicitly confirm they checked the
 * preview against their real statement before the Confirm button unlocks.
 * It can't make a wrong mapping right, but it removes the path where a
 * heuristic guess gets trusted silently.
 */
export function ImportConfidenceNotice({
  institutionLabel,
  mappingSource,
  institutionConfidence,
  acknowledged,
  onAcknowledgedChange,
}: ImportConfidenceNoticeProps) {
  const isVerified = mappingSource === 'exact' && institutionConfidence === 'verified';

  if (isVerified) {
    return (
      <p className="text-success flex items-center gap-1.5 text-xs">
        <ShieldCheck className="size-3.5 shrink-0" />
        {institutionLabel}&apos;s format is verified against known documentation.
      </p>
    );
  }

  const reason =
    mappingSource === 'manual'
      ? "You mapped these columns yourself — we haven't verified this against a real statement."
      : institutionConfidence === 'partial'
        ? `${institutionLabel}'s format is only partially verified — its layout may vary.`
        : `${institutionLabel}'s format was matched by column-name guessing, not a verified reference — it has never been checked against a real file from this institution.`;

  return (
    <div className="border-warning/40 bg-warning/10 rounded-lg border p-3">
      <p className="text-warning-foreground flex items-start gap-1.5 text-xs">
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
        {reason} Check every row in the preview below against your actual statement before confirming.
      </p>
      <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-medium">
        <Checkbox checked={acknowledged} onCheckedChange={(v) => onAcknowledgedChange(v === true)} />
        I&apos;ve reviewed the preview and it matches my real statement
      </label>
    </div>
  );
}
