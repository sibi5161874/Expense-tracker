import { Pressable, View, Switch } from "react-native";
import { ShieldCheck, ShieldAlert, Check } from "lucide-react-native";
import { needsReviewAcknowledgement, type MappingSource, type InstitutionConfidence } from "@repo/shared/logic";
import { AppText } from "@/components/common/AppText";
import { useThemeColor } from "@/lib/colors";

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
 * Mirrors apps/web/src/components/shared/ImportConfidenceNotice.tsx — the honesty
 * mechanism for institutions whose column layout was matched by heuristics rather than
 * verified documentation: requires an explicit "I checked the preview" acknowledgement
 * before Confirm unlocks, rather than silently trusting a guess. See the web component's
 * own header comment for the full rationale (verified vs partial vs heuristic tiers).
 */
export function ImportConfidenceNotice({
  institutionLabel,
  mappingSource,
  institutionConfidence,
  acknowledged,
  onAcknowledgedChange,
}: ImportConfidenceNoticeProps) {
  const success = useThemeColor("success");
  const warningForeground = useThemeColor("warningForeground");
  const primary = useThemeColor("primary");
  const isVerified = mappingSource === "exact" && institutionConfidence === "verified";

  if (isVerified) {
    return (
      <View className="flex-row items-center gap-1.5">
        <ShieldCheck size={14} color={success} />
        <AppText className="text-xs" style={{ color: success }}>
          {institutionLabel}&apos;s format is verified against known documentation.
        </AppText>
      </View>
    );
  }

  const reason =
    mappingSource === "manual"
      ? "You mapped these columns yourself — we haven't verified this against a real statement."
      : institutionConfidence === "partial"
        ? `${institutionLabel}'s format is only partially verified — its layout may vary.`
        : `${institutionLabel}'s format was matched by column-name guessing, not a verified reference — it has never been checked against a real file from this institution.`;

  return (
    <View className="gap-2 rounded-2xl bg-warning-subtle p-3">
      <View className="flex-row items-start gap-1.5">
        <ShieldAlert size={14} color={warningForeground} style={{ marginTop: 2 }} />
        <AppText className="flex-1 text-xs" style={{ color: warningForeground }}>
          {reason} Check every row in the preview below against your actual statement before confirming.
        </AppText>
      </View>
      <Pressable
        onPress={() => onAcknowledgedChange(!acknowledged)}
        className="flex-row items-center gap-2"
        hitSlop={4}
      >
        <Switch value={acknowledged} onValueChange={onAcknowledgedChange} trackColor={{ true: primary }} />
        <AppText className="flex-1 text-xs font-medium">
          I&apos;ve reviewed the preview and it matches my real statement
        </AppText>
        {acknowledged && <Check size={14} color={primary} />}
      </Pressable>
    </View>
  );
}
