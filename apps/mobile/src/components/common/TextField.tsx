import { TextInput, View, type TextInputProps } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useThemeColor } from "@/lib/colors";
import { cn } from "@/lib/cn";

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

/** Mirrors apps/web/src/components/ui/input.tsx + FormLabel/FormMessage composition. */
export function TextField({ label, error, className, ...props }: TextFieldProps) {
  const mutedForeground = useThemeColor("mutedForeground");

  return (
    <View className="gap-1.5">
      <AppText className="text-sm font-medium">{label}</AppText>
      <TextInput
        placeholderTextColor={mutedForeground}
        className={cn(
          "h-12 rounded-2xl border border-border bg-background px-4 text-foreground",
          error && "border-destructive",
          className
        )}
        {...props}
      />
      {error && <AppText className="text-xs text-destructive">{error}</AppText>}
    </View>
  );
}
