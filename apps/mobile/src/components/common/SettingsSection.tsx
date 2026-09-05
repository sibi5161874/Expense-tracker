import { Children, Fragment, type ReactNode } from "react";
import { View } from "react-native";
import { AppText } from "@/components/common/AppText";

interface SettingsSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
}

/**
 * Grouped-list container for a settings screen — an optional label/description above one
 * rounded card, with each child separated by a 1px hairline rather than each sub-block
 * bringing its own card + border-t. Replaces the ad hoc "bg-card p-5 + border-t between
 * blocks" pattern screens were each reinventing slightly differently.
 */
export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  const rows = Children.toArray(children);

  return (
    <View className="gap-2">
      {(title || description) && (
        <View className="px-1">
          {title && <AppText className="text-sm font-semibold">{title}</AppText>}
          {description && <AppText className="mt-1 text-sm text-muted-foreground">{description}</AppText>}
        </View>
      )}
      <View className="rounded-2xl bg-card">
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 && <View className="ml-4 h-px bg-border" />}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}
