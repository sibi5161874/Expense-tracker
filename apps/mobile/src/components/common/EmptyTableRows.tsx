import { View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface EmptyTableRowsProps {
  currentCount: number;
  pageSize: number;
  rowHeight?: number;
}

/**
 * Awwwards / Polished UI Empty Table Row Grid.
 * Renders subtle dashed placeholder slots rather than a pitch-black void,
 * establishing clean data-table scaffolding on mobile feeds.
 */
export function EmptyTableRows({
  currentCount,
  pageSize,
  rowHeight = 48,
}: EmptyTableRowsProps) {
  const { theme } = useTheme();
  // Pad subtly up to 4 empty placeholder slots to prevent gigantic empty chasms
  const targetCount = Math.min(pageSize, Math.max(currentCount + 1, 3));
  const needed = Math.max(0, targetCount - currentCount);

  if (needed <= 0) return null;

  return (
    <View
      className="w-full my-2 rounded-2xl border border-dashed border-border/50 overflow-hidden"
      style={{ backgroundColor: `${theme.card}30` }}
      aria-hidden={true}
    >
      {Array.from({ length: needed }).map((_, idx) => (
        <View
          key={`empty-row-${idx}`}
          className="flex-row items-center justify-between px-4 border-b border-border/20 last:border-b-0"
          style={{
            height: rowHeight,
            backgroundColor: idx % 2 === 1 ? `${theme.card}60` : "transparent",
          }}
        >
          <View className="flex-row items-center gap-2.5">
            <View className="size-6 rounded-lg bg-muted/20" />
            <View className="h-2.5 w-24 rounded-full bg-muted/20" />
          </View>
          <View className="h-2.5 w-16 rounded-full bg-muted/20" />
        </View>
      ))}
    </View>
  );
}
