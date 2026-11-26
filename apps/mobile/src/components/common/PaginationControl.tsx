import { View, Pressable } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/theme/ThemeProvider";

export interface PaginationControlProps {
  page: number; // 0-indexed
  pageSize: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  pageSizeOptions?: number[];
}

/**
 * Mobile Awwwards / Polished UI Data Table Pagination Control.
 * - Displays exact record telemetry with tabular numerals.
 * - Tactile segmented rows-per-page selector with spring scales.
 * - Thumb-friendly 44dp navigation controls with slate-obsidian styling.
 */
export function PaginationControl({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50, 100],
}: PaginationControlProps) {
  const { theme } = useTheme();

  if (totalCount === 0) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalCount);

  return (
    <View
      className="rounded-2xl border border-border/80 p-4 gap-3.5 my-2 shadow-sm"
      style={{
        backgroundColor: theme.card,
      }}
    >
      {/* Top row: Record Telemetry & Rows Selector */}
      <View className="flex-row items-center justify-between flex-wrap gap-2">
        <AppText className="text-xs text-muted-foreground font-medium">
          Showing{" "}
          <AppText
            className="text-xs font-bold text-foreground"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {startItem}–{endItem}
          </AppText>{" "}
          of{" "}
          <AppText
            className="text-xs font-bold text-foreground"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {totalCount}
          </AppText>{" "}
          records
        </AppText>

        {onPageSizeChange && (
          <View className="flex-row items-center gap-1.5">
            <AppText className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
              Rows:
            </AppText>
            <View className="flex-row items-center gap-1">
              {pageSizeOptions.map((size) => {
                const active = size === pageSize;
                return (
                  <Pressable
                    key={size}
                    onPress={() => {
                      onPageSizeChange(size);
                      onPageChange(0);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Set rows per page to ${size}`}
                    className="min-h-[28px] min-w-[32px] items-center justify-center rounded-lg border px-2 py-0.5 active:scale-90"
                    style={{
                      backgroundColor: active
                        ? theme.primary
                        : (theme.surfaceContainerHigh || "transparent"),
                      borderColor: active ? theme.primary : theme.border,
                    }}
                  >
                    <AppText
                      className="text-xs font-bold"
                      style={{
                        color: active
                          ? (theme.onPrimary || "#ffffff")
                          : theme.mutedForeground,
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {size}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Bottom row: Prev / Page Indicator / Next Controls */}
      <View className="flex-row items-center justify-between gap-2.5">
        <Pressable
          onPress={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          accessibilityRole="button"
          accessibilityLabel="Previous page"
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 px-3 min-h-[44px] active:scale-[0.97]"
          style={{
            backgroundColor:
              page === 0 ? "transparent" : (theme.surfaceContainerHigh || theme.card),
            opacity: page === 0 ? 0.35 : 1,
          }}
        >
          <ChevronLeft size={16} color={theme.foreground} />
          <AppText className="text-xs font-semibold text-foreground">
            Previous
          </AppText>
        </Pressable>

        <View
          className="px-3.5 py-2 rounded-xl border border-border items-center justify-center min-w-[96px]"
          style={{
            backgroundColor: theme.surfaceContainerHigh || theme.card,
          }}
        >
          <AppText
            className="text-xs font-bold text-foreground"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            Page {page + 1} of {totalPages}
          </AppText>
        </View>

        <Pressable
          onPress={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages}
          accessibilityRole="button"
          accessibilityLabel="Next page"
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 px-3 min-h-[44px] active:scale-[0.97]"
          style={{
            backgroundColor:
              page + 1 >= totalPages
                ? "transparent"
                : (theme.surfaceContainerHigh || theme.card),
            opacity: page + 1 >= totalPages ? 0.35 : 1,
          }}
        >
          <AppText className="text-xs font-semibold text-foreground">
            Next
          </AppText>
          <ChevronRight size={16} color={theme.foreground} />
        </Pressable>
      </View>
    </View>
  );
}
