import type { ReactNode } from "react";
import { ActivityIndicator, Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useThemeColor } from "@/lib/colors";
import { usePressScale } from "@/theme/usePressScale";
import { fontFamily } from "@/theme/tokens";
import { cn } from "@/lib/cn";

// Material 3 Button Variants
type Variant =
  | "default"
  | "primary"
  | "tonal"
  | "elevated"
  | "outline"
  | "secondary"
  | "text"
  | "ghost"
  | "destructive";
type Size = "sm" | "default" | "lg" | "icon";

const CONTAINER: Record<Variant, string> = {
  default: "bg-primary active:bg-primary/90",
  primary: "bg-primary active:bg-primary/90",
  tonal: "bg-primary-container active:bg-primary-container/80",
  elevated: "bg-surface-container-low active:bg-surface-container-high shadow-sm",
  outline: "border border-outline-variant bg-transparent active:bg-surface-container-highest",
  secondary: "border border-primary bg-transparent active:bg-primary/10",
  text: "bg-transparent active:bg-surface-container-highest",
  ghost: "active:bg-muted",
  destructive: "bg-destructive/15 active:bg-destructive/25",
};

const TEXT: Record<Variant, string> = {
  default: "text-primary-foreground",
  primary: "text-primary-foreground",
  tonal: "text-on-primary-container",
  elevated: "text-primary",
  outline: "text-foreground",
  secondary: "text-primary",
  text: "text-primary",
  ghost: "text-foreground",
  destructive: "text-destructive",
};

// Material 3 shape: canonical rounded-full (pill) for buttons, 40dp default height
const SIZE: Record<Size, string> = {
  sm: "h-9 rounded-full px-4",
  default: "h-10 rounded-full px-5",
  lg: "h-12 rounded-full px-6",
  icon: "size-10 rounded-full",
};

interface ButtonProps extends Omit<PressableProps, "style"> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Material 3 / Google Pixel Button Primitive.
 * Variants: Filled (primary/default), Filled Tonal (tonal), Elevated (elevated),
 * Outlined (outline/secondary), Text (text/ghost), and Destructive.
 * Standard rounded-full pill shape with state layer press animation.
 */
export function Button({
  variant = "default",
  size = "default",
  children,
  className,
  disabled,
  loading,
  leadingIcon,
  trailingIcon,
  style,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const { animatedStyle, onPressIn: scaleIn, onPressOut: scaleOut } = usePressScale(0.97);
  const spinnerColor = useThemeColor(
    variant === "default" || variant === "primary" ? "background" : "primary"
  );
  const isDisabled = disabled || loading;

  const isFlex1 = className?.includes("flex-1");
  const isWFull = className?.includes("w-full");

  return (
    <Animated.View
      style={[
        animatedStyle,
        isFlex1 ? { flex: 1 } : undefined,
        isWFull ? { width: "100%" } : undefined,
        style,
      ]}
      className={cn(isFlex1 && "flex-1", isWFull && "w-full")}
    >
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
          "flex-row items-center justify-center gap-2",
          (isFlex1 || isWFull) && "w-full",
          SIZE[size],
          CONTAINER[variant],
          isDisabled && "opacity-50",
          className
        )}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={spinnerColor} />
        ) : (
          <>
            {leadingIcon}
            {typeof children === "string" ? (
              <AppText
                className={cn("text-sm", TEXT[variant])}
                style={{
                  fontFamily: fontFamily.semibold,
                  letterSpacing: 0.1,
                }}
              >
                {children}
              </AppText>
            ) : (
              children
            )}
            {trailingIcon}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
