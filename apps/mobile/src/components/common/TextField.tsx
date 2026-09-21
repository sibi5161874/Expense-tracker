import { useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily } from "@/theme/tokens";
import { cn } from "@/lib/cn";

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
}

/**
 * Modern, clean input field with clear label hierarchy, active focus borders, and
 * zero text/placeholder collisions.
 */
export function TextField({
  label,
  error,
  helperText,
  className,
  style,
  value,
  multiline,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  const handleFocus: NonNullable<TextInputProps["onFocus"]> = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur: NonNullable<TextInputProps["onBlur"]> = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  const borderColor = error ? theme.destructive : focused ? theme.primary : theme.border;

  return (
    <View className="gap-1.5">
      <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </AppText>
      <View
        className={cn(
          "rounded-2xl border bg-card/60 px-4 transition-colors",
          multiline ? "py-3 min-h-[96px]" : "h-12 justify-center",
          focused && "bg-card shadow-sm"
        )}
        style={{ borderWidth: 1.5, borderColor }}
      >
        <TextInput
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={multiline}
          placeholderTextColor={theme.mutedForeground}
          className={cn(
            "text-sm text-foreground",
            multiline ? "text-left" : "",
            className
          )}
          style={[
            {
              fontFamily: fontFamily.regular,
              textAlignVertical: multiline ? "top" : "center",
              paddingVertical: 0,
              margin: 0,
            },
            style,
          ]}
          {...props}
        />
      </View>
      {error ? (
        <AppText className="text-xs font-medium text-destructive">{error}</AppText>
      ) : helperText ? (
        <AppText className="text-xs text-muted-foreground">{helperText}</AppText>
      ) : null}
    </View>
  );
}

