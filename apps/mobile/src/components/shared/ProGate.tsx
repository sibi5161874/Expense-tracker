import type { ReactNode } from "react";
import { View } from "react-native";
import { BlurView } from "expo-blur";
import { Lock } from "lucide-react-native";
import { useEntitlements } from "@/hooks/useEntitlements";
import { AppText } from "@/components/common/AppText";
import { Button } from "@/components/common/Button";
import { useThemeColor } from "@/lib/colors";
import { cn } from "@/lib/cn";
import type { FeatureKey } from "@repo/shared/config";

interface ProGateProps {
  feature: FeatureKey;
  /** Rendered when the user has access. */
  children: ReactNode;
  /** What the locked state looks like — omit to just hide `children` entirely. */
  fallback?: ReactNode;
}

/** Mirrors apps/web/src/components/shared/ProGate.tsx. A UI convenience, not the security
 * boundary — RLS is what actually protects data; this only decides what renders. */
export function ProGate({ feature, children, fallback }: ProGateProps) {
  const { hasFeature } = useEntitlements();
  if (hasFeature(feature)) return <>{children}</>;
  return <>{fallback ?? null}</>;
}

interface ProLockedButtonProps {
  label: string;
  icon?: ReactNode;
  onUpgradePress: () => void;
}

/** The disabled, upsell-labeled stand-in for a button a free-tier user can't use yet. */
export function ProLockedButton({ label, icon, onUpgradePress }: ProLockedButtonProps) {
  const mutedForeground = useThemeColor("mutedForeground");
  return (
    <Button variant="outline" onPress={onUpgradePress}>
      {icon ?? <Lock size={16} color={mutedForeground} />}
      <AppText className="text-sm font-medium">{label}</AppText>
      <View className="ml-1 rounded bg-warning-subtle px-1.5 py-0.5">
        <AppText className="text-[10px] font-semibold uppercase text-warning-foreground">Pro</AppText>
      </View>
    </Button>
  );
}

interface ProBlurredPreviewProps {
  feature: FeatureKey;
  /** The real content — a chart, a card, whatever's being teased. Still mounted (and still
   * fetching its own data) behind the blur, just visually obscured, so this must not assume
   * it's ever hidden outright. */
  children: ReactNode;
  title: string;
  description: string;
  onUpgradePress: () => void;
  className?: string;
}

/** A softer upsell than ProGate's hide-entirely default — mirrors apps/web's
 * ProBlurredPreview, using expo-blur's BlurView for the native equivalent of a CSS blur
 * filter (RN has no blur filter of its own). */
export function ProBlurredPreview({ feature, children, title, description, onUpgradePress, className }: ProBlurredPreviewProps) {
  const { hasFeature } = useEntitlements();
  if (hasFeature(feature)) return <>{children}</>;

  return (
    <View className={cn("relative overflow-hidden rounded-2xl", className)}>
      <View pointerEvents="none">{children}</View>
      <BlurView intensity={40} tint="default" className="absolute inset-0 items-center justify-center p-4">
        <View className="max-w-xs items-center gap-2 rounded-2xl bg-card p-5">
          <View className="rounded bg-warning-subtle px-1.5 py-0.5">
            <AppText className="text-[10px] font-semibold uppercase text-warning-foreground">Pro</AppText>
          </View>
          <AppText className="text-center text-sm font-semibold">{title}</AppText>
          <AppText className="text-center text-xs text-muted-foreground">{description}</AppText>
          <Button className="mt-1" onPress={onUpgradePress}>
            Upgrade to Pro
          </Button>
        </View>
      </BlurView>
    </View>
  );
}
