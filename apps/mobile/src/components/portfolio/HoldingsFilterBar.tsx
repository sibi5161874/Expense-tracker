import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { Search } from "lucide-react-native";
import type { FilterType, SortKey } from "@repo/shared/types";
import { PickerField } from "@/components/common/PickerField";
import { useThemeColor } from "@/lib/colors";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily } from "@/theme/tokens";

interface HoldingsFilterBarProps {
  sortValue: SortKey;
  onSortChange: (value: SortKey) => void;
  filterValue: FilterType;
  onFilterChange: (value: FilterType) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Value (High → Low)", value: "currentValue_desc" },
  { label: "Return % (High → Low)", value: "returnPct_desc" },
  { label: "Return % (Low → High)", value: "returnPct_asc" },
  { label: "Invested (High → Low)", value: "invested_desc" },
];

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: "All Holdings", value: "all" },
  { label: "Profit Only", value: "profit" },
  { label: "Loss Only", value: "loss" },
];

export function HoldingsFilterBar({
  sortValue,
  onSortChange,
  filterValue,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: HoldingsFilterBarProps) {
  const { theme } = useTheme();
  const mutedForeground = useThemeColor("mutedForeground");
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);

  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  // 200ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

  return (
    <View className="gap-3">
      {/* Search Input */}
      <View
        className="h-12 flex-row items-center rounded-2xl border border-border bg-card/60 px-3.5"
        style={{ borderWidth: 1.5 }}
      >
        <Search size={16} color={mutedForeground} />
        <TextInput
          value={localSearch}
          onChangeText={setLocalSearch}
          placeholder="Search symbol or name…"
          placeholderTextColor={theme.mutedForeground}
          className="ml-2 flex-1 text-sm text-foreground"
          style={{ fontFamily: fontFamily.regular, paddingVertical: 0 }}
        />
      </View>

      {/* Filter and Sort Pickers */}
      <View className="flex-row gap-2">
        <View className="flex-1">
          <PickerField
            label="Filter"
            value={filterValue}
            options={FILTER_OPTIONS}
            onChange={(val) => onFilterChange(val as FilterType)}
          />
        </View>

        <View className="flex-1">
          <PickerField
            label="Sort By"
            value={sortValue}
            options={SORT_OPTIONS}
            onChange={(val) => onSortChange(val as SortKey)}
          />
        </View>
      </View>
    </View>
  );
}
