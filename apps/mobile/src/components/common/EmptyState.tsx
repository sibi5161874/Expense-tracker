import type { ReactNode } from "react";
import { View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { Card } from "@/components/common/Card";
import { useThemeColor } from "@/lib/colors";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

/** Mirrors apps/web/src/components/shared/EmptyState.tsx — one centered icon circle, never per-item badges. */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const accentForeground = useThemeColor("accentForeground");

  return (
    <Card className="items-center gap-4 py-12">
      <View className="size-14 items-center justify-center rounded-full bg-accent">
        <Icon size={24} color={accentForeground} />
      </View>
      <View className="items-center gap-1.5">
        <AppText className="text-lg font-semibold">{title}</AppText>
        <AppText className="max-w-xs text-center text-sm text-muted-foreground">{description}</AppText>
      </View>
      {action}
    </Card>
  );
}
