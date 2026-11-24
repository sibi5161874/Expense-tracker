import { useState, type ReactNode } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily } from "@/theme/tokens";
import { cn } from "@/lib/cn";

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  variant?: "outlined" | "filled";
}

/**
 * Material 3 Text Field Component.
 * - Supports Outlined (default, 16dp radius, outline-variant border) and Filled.
 * - Leading icon & trailing icon accessory slots.
 * - Focused 2px active primary indicator.
 * - Accessible error and supporting text states.
 */
export function TextField({
  label,
  error,
  helperText,
  leadingIcon,
  trailingIcon,
  variant = "outlined",
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

  const borderColor = error
    ? theme.destructive
    : focused
      ? theme.primary
      : theme.outlineVariant || theme.border;

  const isFilled = variant === "filled";

  return (
    <View className="gap-1.5">
      <AppText
        className={cn(
          "text-xs font-semibold tracking-wider",
          error
            ? "text-destructive"
            : focused
              ? "text-primary"
              : "text-muted-foreground"
        )}
      >
        {label}
      </AppText>
      <View
        className={cn(
          "flex-row items-center transition-all",
          isFilled
            ? "rounded-t-xl bg-surface-container-highest/70 px-4 border-b-2"
            : "rounded-xl border bg-card/60 px-4",
          multiline ? "py-3 min-h-[96px] items-start" : "h-12",
          focused && "bg-card shadow-sm"
        )}
        style={{
          borderWidth: isFilled ? 0 : focused ? 2 : 1,
          borderBottomWidth: isFilled ? (focused ? 2 : 1) : focused ? 2 : 1,
          borderColor,
        }}
      >
        {leadingIcon && <View className="mr-3">{leadingIcon}</View>}
        <TextInput
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={multiline}
          placeholderTextColor={theme.mutedForeground}
          className={cn(
            "flex-1 text-sm text-foreground",
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
        {trailingIcon && <View className="ml-3">{trailingIcon}</View>}
      </View>
      {error ? (
        <AppText className="text-xs font-medium text-destructive">{error}</AppText>
      ) : helperText ? (
        <AppText className="text-xs text-muted-foreground">{helperText}</AppText>
      ) : null}
    </View>
  );
}
