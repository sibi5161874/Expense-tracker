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
 * One row inside a SettingsSection — label (+ optional description) on the left, a trailing
 * control (switch, value text, chevron) on the right. 56pt min height keeps every row the
 * same touch target regardless of what it controls.
 */
export function SettingsRow({ label, description, icon, trailing, onPress, showChevron }: SettingsRowProps) {
  const { theme } = useTheme();
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      className="min-h-14 flex-row items-center gap-3 px-4 py-3"
      {...(onPress ? { accessibilityRole: "button" as const } : {})}
    >
      {icon}
      <View className="flex-1">
        <AppText className="text-sm font-medium">{label}</AppText>
        {description && <AppText className="mt-0.5 text-xs text-muted-foreground">{description}</AppText>}
      </View>
      {trailing}
      {showChevron && <ChevronRight size={18} color={theme.mutedForeground} />}
    </Wrapper>
  );
}
