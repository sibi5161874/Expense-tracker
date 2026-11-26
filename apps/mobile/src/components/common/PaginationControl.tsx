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
 * Mobile Data Table Pagination Control.
 * - When total pages is 1, renders an elegant, compact records counter.
 * - When multiple pages exist, renders a modern thumb-friendly pagination bar
 *   with full Previous / Page X of Y / Next controls and optional row selector.
 */
export function PaginationControl({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50],
}: PaginationControlProps) {
  const { theme } = useTheme();

  if (totalCount === 0) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalCount);

  // If all records fit on a single page, show a sleek single-row status strip
  if (totalPages <= 1) {
    return (
      <View
        className="flex-row items-center justify-between rounded-xl border px-4 py-2.5 my-2"
        style={{
          backgroundColor: theme.surfaceContainerLow || theme.card,
          borderColor: theme.outlineVariant ? `${theme.outlineVariant}25` : theme.border,
        }}
      >
        <AppText className="text-xs text-muted-foreground">
          Showing all{" "}
          <AppText className="text-xs font-bold text-foreground">
            {totalCount}
          </AppText>{" "}
          {totalCount === 1 ? "record" : "records"}
        </AppText>

        <View
          className="rounded-full px-2.5 py-0.5"
          style={{
            backgroundColor: theme.surfaceContainerHigh || theme.card,
          }}
        >
          <AppText className="text-[11px] font-semibold text-muted-foreground">
            Page 1 of 1
          </AppText>
        </View>
      </View>
    );
  }

  // Multi-page layout
  return (
    <View
      className="rounded-2xl border p-3.5 gap-3 my-2 shadow-xs"
      style={{
        backgroundColor: theme.surfaceContainerLow || theme.card,
        borderColor: theme.outlineVariant ? `${theme.outlineVariant}33` : theme.border,
      }}
    >
      {/* Top row: Summary & Page Size selector */}
      <View className="flex-row items-center justify-between">
        <AppText className="text-xs text-muted-foreground">
          Showing{" "}
          <AppText className="text-xs font-bold text-foreground">
            {startItem} to {endItem}
          </AppText>{" "}
          of{" "}
          <AppText className="text-xs font-bold text-foreground">
            {totalCount}
          </AppText>{" "}
          records
        </AppText>

        {onPageSizeChange && totalCount > 10 && (
          <View className="flex-row items-center gap-1.5">
            <AppText className="text-[11px] text-muted-foreground">Rows:</AppText>
            {pageSizeOptions.map((size) => {
              const active = size === pageSize;
              return (
                <Pressable
                  key={size}
                  onPress={() => {
                    onPageSizeChange(size);
                    onPageChange(0);
                  }}
                  className="rounded-lg px-2 py-0.5 border"
                  style={{
                    backgroundColor: active ? theme.primary : "transparent",
                    borderColor: active
                      ? theme.primary
                      : theme.outlineVariant
                      ? `${theme.outlineVariant}33`
                      : theme.border,
                  }}
                >
                  <AppText
                    className="text-[11px] font-bold"
                    style={{
                      color: active ? (theme.onPrimary || "#ffffff") : theme.mutedForeground,
                    }}
                  >
                    {size}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Bottom row: Prev / Page X of Y / Next Buttons */}
      <View className="flex-row items-center justify-between gap-2">
        <Pressable
          onPress={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 min-h-[44px]"
          style={{
            backgroundColor:
              page === 0 ? "transparent" : theme.surfaceContainer || theme.card,
            borderColor: theme.outlineVariant ? `${theme.outlineVariant}33` : theme.border,
            opacity: page === 0 ? 0.35 : 1,
          }}
        >
          <ChevronLeft size={16} color={theme.foreground} />
          <AppText className="text-xs font-semibold text-foreground">Previous</AppText>
        </Pressable>

        <View
          className="px-3 py-2 rounded-xl border items-center justify-center min-w-[80px]"
          style={{
            backgroundColor: theme.surfaceContainer || theme.card,
            borderColor: theme.outlineVariant ? `${theme.outlineVariant}33` : theme.border,
          }}
        >
          <AppText className="text-xs font-bold text-foreground">
            {page + 1} / {totalPages}
          </AppText>
        </View>

        <Pressable
          onPress={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 min-h-[44px]"
          style={{
            backgroundColor:
              page + 1 >= totalPages
                ? "transparent"
                : theme.surfaceContainer || theme.card,
            borderColor: theme.outlineVariant ? `${theme.outlineVariant}33` : theme.border,
            opacity: page + 1 >= totalPages ? 0.35 : 1,
          }}
        >
          <AppText className="text-xs font-semibold text-foreground">Next</AppText>
          <ChevronRight size={16} color={theme.foreground} />
        </Pressable>
      </View>
    </View>
  );
}
