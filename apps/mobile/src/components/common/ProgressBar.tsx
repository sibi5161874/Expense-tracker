import { View } from "react-native";
import { useThemeColor } from "@/lib/colors";

interface ProgressBarProps {
  /** 0-100 */
  value: number;
  /** Overrides the default primary fill (e.g. success/warning/destructive by status). */
  color?: string;
}

/** Mirrors apps/web/src/components/ui/progress.tsx — flat track, rounded-full fill, no chrome. */
export function ProgressBar({ value, color }: ProgressBarProps) {
  const primary = useThemeColor("primary");
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <View className="h-1.5 overflow-hidden rounded-full bg-muted">
      <View className="h-full rounded-full" style={{ width: `${clamped}%`, backgroundColor: color ?? primary }} />
    </View>
  );
}
