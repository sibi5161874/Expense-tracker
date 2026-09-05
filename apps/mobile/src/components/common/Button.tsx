import type { ReactNode } from "react";
import { ActivityIndicator, Animated, Pressable, type PressableProps } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useThemeColor } from "@/lib/colors";
import { usePressScale } from "@/theme/usePressScale";
import { fontFamily } from "@/theme/tokens";
import { cn } from "@/lib/cn";

// "primary" is a new name for what was "default" — kept as an alias below so the ~30
// existing call sites written as variant="default" (the implicit default, i.e. no variant
// prop at all) keep working unchanged; "outline" (neutral grey border, 19 existing call
// sites) is untouched and distinct from the brief's "Secondary" concept, added here as its
// own primary-bordered variant instead of overloading/renaming "outline" and breaking every
// consumer.
type Variant = "default" | "primary" | "outline" | "secondary" | "text" | "ghost" | "destructive";
type Size = "sm" | "default" | "lg" | "icon";

const CONTAINER: Record<Variant, string> = {
  default: "bg-primary active:bg-primary/80",
  primary: "bg-primary active:bg-primary/80",
  outline: "border border-border bg-background active:bg-muted",
  // Outlined in the accent color specifically — the brief's "Secondary" button, distinct
  // from the existing neutral-grey "outline".
  secondary: "border border-primary bg-transparent active:bg-primary/10",
  text: "bg-transparent active:bg-muted",
  ghost: "active:bg-muted",
  destructive: "bg-destructive/10 active:bg-destructive/20",
};

const TEXT: Record<Variant, string> = {
  default: "text-primary-foreground",
  primary: "text-primary-foreground",
  outline: "text-foreground",
  secondary: "text-primary",
  text: "text-primary",
  ghost: "text-foreground",
  destructive: "text-destructive",
};

// rounded-button = radius.button (12dp) from theme/tokens.ts — every variant/size shares it;
// only padding/height change per size.
const SIZE: Record<Size, string> = {
  sm: "h-9 rounded-button px-3",
  default: "h-11 rounded-button px-4",
  lg: "h-14 rounded-button px-6",
  // Square, not just "small" — icon buttons need equal width/height to read as a button
  // rather than a clipped rectangle around an icon.
  icon: "size-11 rounded-button",
};

interface ButtonProps extends Omit<PressableProps, "style"> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
  loading?: boolean;
}

/**
 * PRISM OPS button. Five variants (primary/secondary/text/ghost/destructive) × four sizes,
 * radius.button (12dp) throughout, a spring "press and lift" scale via usePressScale, and a
 * loading state that swaps the label for a spinner without changing the button's size.
 * `ghost` is kept alongside the brief's four named variants (primary/secondary/text/
 * destructive) — it's already used by existing screens for a no-border tertiary action
 * distinct from `text` (bare word-as-button) and wasn't in the original spec to remove.
 * Minimum touch target is enforced by the size scale itself (`sm` is still 36pt tall,
 * `icon` is a full 44x44pt square) rather than an invisible hit-slop hack.
 */
export function Button({
  variant = "default",
  size = "default",
  children,
  className,
  disabled,
  loading,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const { animatedStyle, onPressIn: scaleIn, onPressOut: scaleOut } = usePressScale();
  const spinnerColor = useThemeColor(variant === "default" || variant === "primary" ? "background" : "primary");
  const isDisabled = disabled || loading;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        disabled={isDisabled}
        onPressIn={(e) => {
          scaleIn();
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scaleOut();
          onPressOut?.(e);
        }}
        className={cn(
          "flex-row items-center justify-center gap-1.5",
          SIZE[size],
          CONTAINER[variant],
          isDisabled && "opacity-50",
          className
        )}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={spinnerColor} />
        ) : typeof children === "string" ? (
          <AppText
            className={cn("text-sm", TEXT[variant])}
            style={{ fontFamily: variant === "text" ? fontFamily.bold : fontFamily.semibold }}
          >
            {children}
          </AppText>
        ) : (
          children
        )}
      </Pressable>
    </Animated.View>
  );
}
