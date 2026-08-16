import { Pressable, View } from "react-native";
import { AppText } from "@/components/common/AppText";
import { cn } from "@/lib/cn";

export interface SegmentedControlOption {
  value: string;
  label: string;
}

/** Mirrors apps/web/src/components/ui/segmented-control.tsx — pill capsule, solid accent2
 * (purple) fill + white text on the active option, per design spec §5C. */
export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="flex-row gap-1 rounded-2xl border border-border p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={cn("rounded-xl px-3 py-1.5", active && "bg-accent2")}
          >
            <AppText className={cn("text-sm font-medium", active ? "text-accent2-foreground" : "text-muted-foreground")}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
