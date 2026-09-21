import { View } from "react-native";
import { AppText } from "@/components/common/AppText";
import { cn } from "@/lib/cn";
import type { BadgeTone } from "@/lib/badgeTones";

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "bg-success-subtle",
  destructive: "bg-destructive-subtle",
  warning: "bg-warning-subtle",
  info: "bg-info-subtle",
  neutral: "bg-muted",
};

const TONE_TEXT_CLASSES: Record<BadgeTone, string> = {
  success: "text-success",
  destructive: "text-destructive",
  warning: "text-warning-foreground",
  info: "text-info",
  neutral: "text-muted-foreground",
};

/** Mirrors apps/web/src/components/shared/StatusBadge.tsx. */
export function StatusBadge({ tone, children, className }: { tone: BadgeTone; children: string; className?: string }) {
  return (
    <View className={cn("self-start rounded-full px-2.5 py-0.5", TONE_CLASSES[tone], className)}>
      <AppText className={cn("text-xs font-medium", TONE_TEXT_CLASSES[tone])}>{children}</AppText>
    </View>
  );
}
