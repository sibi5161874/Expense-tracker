import { View } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/theme/ThemeProvider";

interface CountBadgeProps {
  /** Omit for a plain notification dot; pass a number for a numeric pill (e.g. unread count). */
  count?: number;
  max?: number;
}

/**
 * The small red dot/numeric pill overlaid on an icon or nav item (unread counts, "new
 * items" markers) — distinct from Badge.tsx's StatusBadge, which is a labeled status pill
 * ("Achieved", "Overdue") sitting inline in content, not overlaid on another element.
 */
export function CountBadge({ count, max = 99 }: CountBadgeProps) {
  const { theme } = useTheme();
  const isDot = count === undefined;
  const label = count !== undefined && count > max ? `${max}+` : String(count ?? "");

  return (
    <View
      className="items-center justify-center rounded-pill"
      style={{
        minWidth: isDot ? 10 : 18,
        height: isDot ? 10 : 18,
        paddingHorizontal: isDot ? 0 : 5,
        backgroundColor: theme.destructive,
      }}
    >
      {!isDot && (
        <AppText style={{ fontSize: 11, lineHeight: 14, color: theme.destructiveForeground, fontWeight: "700" }}>
          {label}
        </AppText>
      )}
    </View>
  );
}
