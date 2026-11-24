import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/theme/ThemeProvider";

interface SettingsRowProps {
  label: string;
  description?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
}

/**
 * Material 3 List Item / Settings Row.
 * - 56dp minimum touch height.
 * - Icon container with proper M3 alignment.
 * - Body-large label (16dp) with Body-small secondary description (12dp).
 */
export function SettingsRow({
  label,
  description,
  icon,
  trailing,
  onPress,
  showChevron,
}: SettingsRowProps) {
  const { theme } = useTheme();
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      className="min-h-14 flex-row items-center gap-3.5 px-4 py-3 active:bg-surface-container-highest/50"
      {...(onPress ? { accessibilityRole: "button" as const } : {})}
    >
      {icon && <View className="items-center justify-center size-8">{icon}</View>}
      <View className="flex-1">
        <AppText className="text-[15px] font-medium text-foreground">{label}</AppText>
        {description && (
          <AppText className="mt-0.5 text-xs text-muted-foreground leading-4">{description}</AppText>
        )}
      </View>
      {trailing}
      {showChevron && <ChevronRight size={18} color={theme.mutedForeground} />}
    </Wrapper>
  );
}
