import type { ReactNode } from "react";
import { View } from "react-native";
import { AppText } from "@/components/common/AppText";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Mirrors apps/web/src/components/shared/PageHeader.tsx. */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <View className="flex-1">
        <AppText className="text-2xl font-bold tracking-tight">{title}</AppText>
        {description && <AppText className="mt-1 text-sm text-muted-foreground">{description}</AppText>}
      </View>
      {action}
    </View>
  );
}
