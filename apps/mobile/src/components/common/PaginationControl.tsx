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
 * Mobile Paginated Data Table Navigation Control.
 * Mirrors the clean thumb-friendly mobile layout from web DataTable.
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
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalCount);

  return (
    <View
      className="rounded-2xl border p-3.5 gap-2.5 my-2"
      style={{
        backgroundColor: theme.surfaceContainerLow || theme.card,
        borderColor: theme.outlineVariant ? `${theme.outlineVariant}33` : theme.border,
      }}
    >
      {/* Top row: Summary & Page Size selector */}
      <View className="flex-row items-center justify-between">
        <AppText className="text-xs font-medium text-muted-foreground">
          Showing{" "}
          <AppText className="text-xs font-bold text-foreground">
            {startItem}–{endItem}
          </AppText>{" "}
          of{" "}
          <AppText className="text-xs font-bold text-foreground">
            {totalCount}
          </AppText>{" "}
          records
        </AppText>

        {onPageSizeChange && (
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
      <View className="flex-row items-center justify-between gap-2 pt-1">
        <Pressable
          onPress={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3"
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

        <View className="px-2 items-center justify-center min-w-[70px]">
          <AppText className="text-xs font-bold text-foreground">
            Page {page + 1} of {totalPages}
          </AppText>
        </View>

        <Pressable
          onPress={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3"
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
