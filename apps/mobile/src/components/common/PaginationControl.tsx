import { useState, useMemo } from "react";
import {
  View,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/theme/ThemeProvider";

export interface PaginationHeaderProps {
  page: number; // 0-indexed
  pageSize: number;
  totalCount: number;
  onOpenSheet?: () => void;
  className?: string;
}

/**
 * Top Telemetry Range & Density Filter Header.
 * Displays "Showing X–Y of Z" in tabular monospace with the interactive "{pageSize} / page [tune]" trigger.
 */
export function PaginationHeader({
  page,
  pageSize,
  totalCount,
  onOpenSheet,
  className = "",
}: PaginationHeaderProps) {
  const { theme } = useTheme();

  if (totalCount === 0) return null;

  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalCount);

  return (
    <View className={`flex-row items-center justify-between px-1 py-1 ${className}`}>
      <AppText
        className="text-xs text-muted-foreground font-mono"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        Showing {startItem}–{endItem} of {totalCount}
      </AppText>

      {onOpenSheet && (
        <Pressable
          onPress={onOpenSheet}
          accessibilityRole="button"
          accessibilityLabel={`Change rows per page. Currently ${pageSize} per page`}
          className="flex-row items-center gap-1.5 py-1 px-2 rounded-lg active:opacity-70"
          style={{
            backgroundColor: theme.surfaceContainerLow || theme.card,
            borderColor: theme.outlineVariant ? `${theme.outlineVariant}44` : theme.border,
            borderWidth: 1,
          }}
        >
          <AppText
            className="text-xs font-semibold"
            style={{
              color: theme.primary,
              fontVariant: ["tabular-nums"],
            }}
          >
            {pageSize} / page
          </AppText>
          <SlidersHorizontal size={13} color={theme.primary} />
        </Pressable>
      )}
    </View>
  );
}

export interface PaginationControlProps {
  page: number; // 0-indexed
  pageSize: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  pageSizeOptions?: number[];
  /** Optional container style / class override */
  className?: string;
  /** Whether to render the telemetry range row above the dock (default: true) */
  showTelemetry?: boolean;
  /** Controlled sheet visibility */
  sheetVisible?: boolean;
  /** Callback when sheet visibility changes */
  onSheetVisibilityChange?: (visible: boolean) => void;
}

/**
 * Material Design 3 (M3) Data Table & List Pagination Control.
 * - Follows transactions_mobile_pagination.html UX & specifications.
 * - Upper telemetry & density trigger row with tabular numerals.
 * - 3-column thumb-zone navigation dock (44dp Prev / Jump Sheet Trigger / 44dp Next).
 * - M3 Bottom Sheet dialog for direct page jumping and rows-per-page selection.
 */
export function PaginationControl({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50, 100],
  className = "",
  showTelemetry = true,
  sheetVisible: controlledSheetVisible,
  onSheetVisibilityChange,
}: PaginationControlProps) {
  const { theme } = useTheme();
  const [internalSheetVisible, setInternalSheetVisible] = useState(false);
  const isSheetOpen =
    controlledSheetVisible !== undefined
      ? controlledSheetVisible
      : internalSheetVisible;

  const setSheetOpen = (val: boolean) => {
    if (onSheetVisibilityChange) {
      onSheetVisibilityChange(val);
    }
    setInternalSheetVisible(val);
  };

  const [jumpPageInput, setJumpPageInput] = useState(String(page + 1));

  if (totalCount === 0) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage1Based = Math.min(totalPages, Math.max(1, page + 1));
  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalCount);

  // Smart candidate pages for quick jump chips (matches HTML design: 1, 2, prev, current, next, max)
  const quickJumpCandidates = useMemo(() => {
    const raw = [
      1,
      2,
      currentPage1Based - 1,
      currentPage1Based,
      currentPage1Based + 1,
      totalPages,
    ];
    return Array.from(new Set(raw))
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);
  }, [currentPage1Based, totalPages]);

  const handleOpenSheet = () => {
    setJumpPageInput(String(currentPage1Based));
    setSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
  };

  const handleJumpSubmit = () => {
    const target = Number(jumpPageInput);
    if (!isNaN(target)) {
      const clamped = Math.min(totalPages, Math.max(1, target));
      onPageChange(clamped - 1);
    }
    handleCloseSheet();
  };

  const handleQuickJump = (targetPage1Based: number) => {
    onPageChange(targetPage1Based - 1);
    handleCloseSheet();
  };

  const handleSelectRowsPerPage = (size: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(size);
      onPageChange(0);
    }
    handleCloseSheet();
  };

  const borderStyle = {
    borderColor: theme.outlineVariant
      ? `${theme.outlineVariant}44`
      : theme.border,
  };

  return (
    <View className={`gap-2 ${className}`}>
      {/* 1. Telemetry Range & Density Shortcut Header (optional when rendered inline) */}
      {showTelemetry && (
        <PaginationHeader
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onOpenSheet={onPageSizeChange ? handleOpenSheet : undefined}
        />
      )}

      {/* 2. Thumb-Zone 3-Column Navigation Dock */}
      <View className="flex-row items-center gap-2">
        {/* Previous Page Button (44dp) */}
        <Pressable
          onPress={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          accessibilityRole="button"
          accessibilityLabel="Previous page"
          className="w-11 h-11 rounded-xl border items-center justify-center active:scale-[0.96]"
          style={{
            backgroundColor: theme.surfaceContainerLow || theme.card,
            opacity: page === 0 ? 0.35 : 1,
            ...borderStyle,
          }}
        >
          <ChevronLeft
            size={20}
            color={page === 0 ? theme.mutedForeground : theme.foreground}
          />
        </Pressable>

        {/* Center Page & Density Sheet Trigger */}
        <Pressable
          onPress={handleOpenSheet}
          accessibilityRole="button"
          accessibilityLabel={`Page ${currentPage1Based} of ${totalPages}, ${pageSize} rows per page. Tap to jump page or change density.`}
          className="flex-1 min-h-[44px] flex-row items-center justify-between px-3.5 rounded-xl border active:scale-[0.99]"
          style={{
            backgroundColor: theme.surfaceContainerLow || theme.card,
            ...borderStyle,
          }}
        >
          <AppText
            className="text-sm font-semibold text-foreground font-mono"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            Page {currentPage1Based} of {totalPages}
          </AppText>

          <View className="flex-row items-center gap-1.5">
            <AppText
              className="text-xs font-semibold"
              style={{
                color: theme.primary,
                fontVariant: ["tabular-nums"],
              }}
            >
              {pageSize} rows
            </AppText>
            <ChevronsUpDown size={15} color={theme.primary} />
          </View>
        </Pressable>

        {/* Next Page Button (44dp) */}
        <Pressable
          onPress={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages}
          accessibilityRole="button"
          accessibilityLabel="Next page"
          className="w-11 h-11 rounded-xl border items-center justify-center active:scale-[0.96]"
          style={{
            backgroundColor: theme.surfaceContainerLow || theme.card,
            opacity: page + 1 >= totalPages ? 0.35 : 1,
            ...borderStyle,
          }}
        >
          <ChevronRight
            size={20}
            color={
              page + 1 >= totalPages
                ? theme.mutedForeground
                : theme.primary
            }
          />
        </Pressable>
      </View>

      {/* 3. Material 3 Bottom Sheet: Page & Density Modal */}
      <Modal
        visible={isSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={handleCloseSheet}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          {/* Backdrop overlay */}
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
            onPress={handleCloseSheet}
            accessibilityLabel="Close page sheet overlay"
          />

          {/* Bottom Sheet Surface (28dp top corners) */}
          <View
            style={{
              backgroundColor: theme.surfaceContainerLow || theme.card,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTopWidth: 1,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              ...borderStyle,
            }}
            className="p-5 pb-8 shadow-xl"
          >
            {/* Drag Handle */}
            <View
              className="w-9 h-1 rounded-full self-center mb-4"
              style={{
                backgroundColor: theme.outlineVariant
                  ? `${theme.outlineVariant}66`
                  : theme.border,
              }}
            />

            {/* Header: Title, Description & Close Button */}
            <View className="flex-row items-start justify-between gap-3 mb-5">
              <View className="flex-1">
                <AppText className="text-base font-bold text-foreground">
                  Page & Density
                </AppText>
                <AppText className="text-xs text-muted-foreground mt-0.5">
                  Jump directly to a page or change rows per page.
                </AppText>
              </View>

              <Pressable
                onPress={handleCloseSheet}
                accessibilityRole="button"
                accessibilityLabel="Close sheet"
                className="w-8 h-8 rounded-full items-center justify-center active:opacity-70"
                style={{
                  backgroundColor:
                    theme.surfaceContainerHigh || theme.surfaceContainer || theme.border,
                }}
              >
                <X size={16} color={theme.foreground} />
              </Pressable>
            </View>

            {/* Section 1: Quick Jump Input & Chips */}
            <View className="gap-2 mb-6">
              <AppText className="text-xs font-semibold text-muted-foreground">
                Jump to page (1–
                <AppText
                  className="text-xs font-semibold text-muted-foreground"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {totalPages}
                </AppText>
                )
              </AppText>

              <View className="flex-row items-center gap-2">
                <TextInput
                  value={jumpPageInput}
                  onChangeText={setJumpPageInput}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleJumpSubmit}
                  className="flex-1 min-h-[44px] px-3.5 rounded-xl border text-sm font-semibold"
                  style={{
                    backgroundColor:
                      theme.surfaceContainerLowest || theme.background,
                    color: theme.foreground,
                    fontVariant: ["tabular-nums"],
                    ...borderStyle,
                    borderWidth: 1,
                  }}
                  placeholder="1"
                  placeholderTextColor={theme.mutedForeground}
                />
                <Pressable
                  onPress={handleJumpSubmit}
                  accessibilityRole="button"
                  accessibilityLabel="Jump to entered page"
                  className="min-h-[44px] px-5 rounded-xl items-center justify-center active:scale-[0.97]"
                  style={{ backgroundColor: theme.primary }}
                >
                  <AppText
                    className="text-sm font-bold"
                    style={{ color: theme.onPrimary || "#ffffff" }}
                  >
                    Go
                  </AppText>
                </Pressable>
              </View>

              {/* Quick Jump Page Chips */}
              <View className="flex-row flex-wrap items-center gap-1.5 pt-1">
                {quickJumpCandidates.map((p) => {
                  const isActive = p === currentPage1Based;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => handleQuickJump(p)}
                      accessibilityRole="button"
                      accessibilityLabel={`Jump to page ${p}`}
                      className="min-h-[36px] min-w-[42px] px-3 items-center justify-center rounded-lg border active:scale-[0.95]"
                      style={{
                        backgroundColor: isActive
                          ? (theme.primaryContainer || theme.primary)
                          : (theme.surfaceContainerLowest || theme.background),
                        borderColor: isActive
                          ? (theme.primaryContainer || theme.primary)
                          : (theme.outlineVariant ? `${theme.outlineVariant}55` : theme.border),
                      }}
                    >
                      <AppText
                        className="text-xs font-bold"
                        style={{
                          color: isActive
                            ? (theme.onPrimaryContainer || theme.onPrimary || "#ffffff")
                            : theme.foreground,
                          fontVariant: ["tabular-nums"],
                        }}
                      >
                        {p}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Section 2: Rows Per Page Segmented Grid */}
            {onPageSizeChange && (
              <View className="gap-2">
                <AppText className="text-xs font-semibold text-muted-foreground">
                  Rows per page
                </AppText>
                <View className="flex-row items-center gap-2">
                  {pageSizeOptions.map((size) => {
                    const isActive = size === pageSize;
                    return (
                      <Pressable
                        key={size}
                        onPress={() => handleSelectRowsPerPage(size)}
                        accessibilityRole="button"
                        accessibilityLabel={`Set rows per page to ${size}`}
                        className="flex-1 min-h-[44px] items-center justify-center rounded-xl border active:scale-[0.95]"
                        style={{
                          backgroundColor: isActive
                            ? (theme.primaryContainer || theme.primary)
                            : (theme.surfaceContainerLowest || theme.background),
                          borderColor: isActive
                            ? (theme.primaryContainer || theme.primary)
                            : (theme.outlineVariant ? `${theme.outlineVariant}55` : theme.border),
                        }}
                      >
                        <AppText
                          className="text-sm font-bold"
                          style={{
                            color: isActive
                              ? (theme.onPrimaryContainer || theme.onPrimary || "#ffffff")
                              : theme.foreground,
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
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
