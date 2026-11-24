import { Pressable, View } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/theme/ThemeProvider";
import { cn } from "@/lib/cn";

export interface SegmentedControlOption {
  value: string;
  label: string;
}

/**
 * Material 3 Segmented Button Component.
 * - Pill container (`rounded-full`) with 40dp height.
 * - Active segment pill with secondary-container fill and on-secondary-container text.
 * - M3 label-large typography.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { theme } = useTheme();

  return (
    <View
      className="flex-row items-center rounded-full border p-1"
      style={{
        borderColor: theme.outlineVariant ? `${theme.outlineVariant}66` : theme.border,
        backgroundColor: theme.surfaceContainer || "transparent",
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={cn(
              "flex-1 items-center justify-center rounded-full py-2 px-3 transition-colors",
              active ? "bg-secondary-container shadow-sm" : "bg-transparent"
            )}
            style={
              active
                ? {
                    backgroundColor: theme.secondaryContainer || theme.primaryContainer,
                  }
                : undefined
            }
          >
            <AppText
              className={cn(
                "text-xs font-semibold tracking-wide",
                active ? "text-on-secondary-container" : "text-muted-foreground"
              )}
              style={
                active
                  ? {
                      color: theme.onSecondaryContainer || theme.primary,
                    }
                  : undefined
              }
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
