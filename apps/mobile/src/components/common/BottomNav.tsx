import type { ComponentProps } from "react";
import { View, Pressable } from "react-native";
import { Tabs } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutDashboard, ArrowLeftRight, PieChart, MoreHorizontal } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/theme/ThemeProvider";
import { usePressScale } from "@/theme/usePressScale";
import { cn } from "@/lib/cn";

export type BottomNavProps = NonNullable<ComponentProps<typeof Tabs>["tabBar"]> extends (props: infer P) => unknown
  ? P
  : never;

interface TabItemConfig {
  name: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const TAB_CONFIGS: Record<string, TabItemConfig> = {
  dashboard: {
    name: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  transactions: {
    name: "transactions",
    label: "Transactions",
    icon: ArrowLeftRight,
  },
  portfolio: {
    name: "portfolio",
    label: "Portfolio",
    icon: PieChart,
  },
  more: {
    name: "more",
    label: "More",
    icon: MoreHorizontal,
  },
};

function NavTabItem({
  config,
  isFocused,
  onPress,
  onLongPress,
}: {
  config: TabItemConfig;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { theme } = useTheme();
  const { onPressIn, onPressOut } = usePressScale(0.92);
  const IconComponent = config.icon;

  const activeColor = theme.onSecondaryContainer || theme.primary;
  const inactiveColor = theme.mutedForeground;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={config.label}
      className="flex-1 items-center justify-center py-2"
    >
      {/* M3 Active Indicator Pill (64x32dp) */}
      <View
        className={cn(
          "h-8 w-16 items-center justify-center rounded-full transition-colors duration-150 ease-out",
          isFocused ? "bg-secondary-container" : "bg-transparent"
        )}
        style={[
          isFocused
            ? {
                backgroundColor: theme.secondaryContainer || theme.primaryContainer,
                transform: [{ scale: 1 }],
              }
            : {
                transform: [{ scale: 0.9 }],
              },
        ]}
      >
        <IconComponent
          size={22}
          color={isFocused ? activeColor : inactiveColor}
          strokeWidth={isFocused ? 2.4 : 1.8}
        />
      </View>
      <AppText
        className={cn(
          "mt-1 text-center text-[12px] tracking-wide",
          isFocused ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
        )}
        style={{
          color: isFocused ? theme.foreground : theme.mutedForeground,
        }}
      >
        {config.label}
      </AppText>
    </Pressable>
  );
}

/**
 * Material 3 / Google Pixel Navigation Bar.
 * - 80dp canonical height (+ bottom safe area inset).
 * - Active pill indicator: 64x32dp rounded-full container.
 * - Clean elevation and surface container color.
 * - Filters out hidden / utility routes automatically.
 */
export function BottomNav({ state, descriptors, navigation }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View
      className="border-t border-outline-variant/20 bg-card"
      style={{
        backgroundColor: theme.surfaceContainer || theme.card,
        borderTopColor: theme.outlineVariant ? `${theme.outlineVariant}33` : theme.border,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 8,
        minHeight: 80 + Math.max(insets.bottom, 8),
      }}
    >
      <View className="flex-row items-center justify-around px-2">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const href = (options as { href?: string | null })?.href;
          if (href === null || !TAB_CONFIGS[route.name]) {
            return null;
          }

          const isFocused = state.index === index;
          const config = TAB_CONFIGS[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <NavTabItem
              key={route.key}
              config={config}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}
