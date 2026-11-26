import { View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface EmptyTableRowsProps {
  currentCount: number;
  pageSize: number;
  rowHeight?: number;
}

/**
 * Renders subtle empty row placeholders so the data table height
 * consistently matches `pageSize` rows, preventing the layout from
 * collapsing when only a few records exist on the page.
 */
export function EmptyTableRows({
  currentCount,
  pageSize,
  rowHeight = 72,
}: EmptyTableRowsProps) {
  const { theme } = useTheme();
  // Pad up to pageSize, capped at a reasonable limit (e.g. 10 or pageSize)
  const targetCount = Math.min(pageSize, 25);
  const needed = Math.max(0, targetCount - currentCount);

  if (needed <= 0) return null;

  return (
    <View className="w-full">
      {Array.from({ length: needed }).map((_, idx) => (
        <View
          key={`empty-row-${idx}`}
          style={{
            height: rowHeight,
            borderBottomWidth: 1,
            borderBottomColor: theme.outlineVariant ? `${theme.outlineVariant}12` : "#88888810",
            backgroundColor: idx % 2 === 1 ? (theme.surfaceContainerLowest || "transparent") : "transparent",
          }}
        />
      ))}
    </View>
  );
}
