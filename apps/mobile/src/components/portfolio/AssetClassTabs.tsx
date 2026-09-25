import { useMemo } from "react";
import { ScrollView, Pressable, View } from "react-native";
import type { SymbolHolding } from "@repo/shared/logic";
import { AppText } from "@/components/common/AppText";

interface AssetClassTabsProps {
  holdings: SymbolHolding[];
  selectedTab: string;
  onSelectTab: (tab: string) => void;
}

const PREFERRED_ORDER = ["All", "Stock", "Mutual Fund", "ETF", "Gold", "Crypto", "Other"];

export function AssetClassTabs({ holdings, selectedTab, onSelectTab }: AssetClassTabsProps) {
  const tabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const h of holdings) {
      const type = (h.assetType || "Other").trim() || "Other";
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }

    const availableTypes = Array.from(counts.keys());
    availableTypes.sort((a, b) => {
      const idxA = PREFERRED_ORDER.indexOf(a);
      const idxB = PREFERRED_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return [
      { key: "All", label: "All", count: holdings.length },
      ...availableTypes.map((type) => ({
        key: type,
        label: type,
        count: counts.get(type) ?? 0,
      })),
    ];
  }, [holdings]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 py-1"
    >
      {tabs.map((tab) => {
        const isActive = selectedTab.toLowerCase() === tab.key.toLowerCase();
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelectTab(tab.key)}
            className={`rounded-full px-4 py-2 border active:opacity-70 ${
              isActive
                ? "bg-primary border-primary"
                : "bg-background border-border"
            }`}
          >
            <AppText
              className={`text-sm font-medium ${
                isActive ? "text-primary-foreground font-semibold" : "text-muted-foreground"
              }`}
            >
              {tab.label}
              <AppText className={`text-xs ${isActive ? "text-primary-foreground/80" : "text-muted-foreground/70"}`}>
                {" "}({tab.count})
              </AppText>
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
