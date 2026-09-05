import { useRef, useState } from "react";
import { Animated, TextInput, View, type TextInputProps } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/theme/ThemeProvider";
import { fontFamily, motion } from "@/theme/tokens";
import { cn } from "@/lib/cn";

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

/**
 * Floating label (label sits inside the field until focus/content, then animates up and
 * shrinks — same pattern as apps/web's shadcn FormLabel-above-Input, adapted for RN since
 * there's no CSS :focus-within to key off here). Active state: border AND label turn
 * primary. A 4px primary-at-20%-opacity focus ring sits behind the field (RN has no
 * outline/box-shadow-on-focus, so this is a second, slightly larger, absolutely-positioned
 * View faded in behind it) rather than a redrawn border, so the border itself doesn't shift
 * the field's layout width when focus toggles.
 */
export function TextField({ label, error, className, style, value, onFocus, onBlur, ...props }: TextFieldProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const hasValue = !!value;
  const floated = focused || hasValue;
  const labelAnim = useRef(new Animated.Value(floated ? 1 : 0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  function animateTo(target: Animated.Value, toValue: number) {
    Animated.timing(target, { toValue, duration: motion.duration.base, useNativeDriver: false }).start();
  }

  const handleFocus: NonNullable<TextInputProps["onFocus"]> = (e) => {
    setFocused(true);
    animateTo(labelAnim, 1);
    animateTo(glowAnim, 1);
    onFocus?.(e);
  };

  const handleBlur: NonNullable<TextInputProps["onBlur"]> = (e) => {
    setFocused(false);
    animateTo(labelAnim, hasValue ? 1 : 0);
    animateTo(glowAnim, 0);
    onBlur?.(e);
  };

  const borderColor = error ? theme.destructive : focused ? theme.primary : theme.border;
  const labelColor = error ? theme.destructive : focused ? theme.primary : theme.mutedForeground;

  return (
    <View className="gap-1.5">
      <View>
        {/* Focus ring: 4px primary at 20% opacity, behind the field, only visible while focused. */}
        <Animated.View
          pointerEvents="none"
          className="absolute -inset-1 rounded-input"
          style={{ backgroundColor: theme.primary, opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.2] }) }}
        />
        <View className="rounded-input bg-background" style={{ borderWidth: 1, borderColor }}>
          <Animated.View
            className="absolute left-4"
            style={{
              top: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 6] }),
              transform: [{ scale: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] }) }],
            }}
          >
            <AppText style={{ fontFamily: fontFamily.medium, color: labelColor }}>{label}</AppText>
          </Animated.View>
          <TextInput
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor={theme.mutedForeground}
            className={cn("h-14 px-4 pt-5 text-foreground", className)}
            style={[{ fontFamily: fontFamily.regular }, style]}
            {...props}
          />
        </View>
      </View>
      {error && <AppText className="text-xs text-destructive">{error}</AppText>}
    </View>
  );
}
