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
  default: "bg-primary active:opacity-90 shadow-sm",
  primary: "bg-primary active:opacity-90 shadow-sm",
  tonal: "bg-primary-container active:bg-primary-container/80",
  elevated: "bg-surface-container-low active:bg-surface-container-high shadow-md",
  outline: "border border-border/80 bg-surface active:bg-muted/50",
  secondary: "border-2 border-primary bg-transparent active:bg-primary/10",
  text: "bg-transparent active:bg-muted/40",
  ghost: "active:bg-muted/50",
  destructive: "bg-destructive active:opacity-90 shadow-sm",
};

const TEXT: Record<Variant, string> = {
  default: "text-primary-foreground font-semibold",
  primary: "text-primary-foreground font-semibold",
  tonal: "text-on-primary-container font-semibold",
  elevated: "text-primary font-semibold",
  outline: "text-foreground font-semibold",
  secondary: "text-primary font-semibold",
  text: "text-primary font-semibold",
  ghost: "text-foreground font-medium",
  destructive: "text-destructive-foreground font-bold",
};

// Material 3 / iOS standard touch targets (48dp standard minimum touch target)
const SIZE_CONFIG: Record<
  Size,
  { height: number; minHeight: number; paddingHorizontal: number; borderRadius: number }
> = {
  sm: { height: 42, minHeight: 42, paddingHorizontal: 16, borderRadius: 12 },
  default: { height: 48, minHeight: 48, paddingHorizontal: 20, borderRadius: 14 },
  lg: { height: 52, minHeight: 52, paddingHorizontal: 24, borderRadius: 16 },
  icon: { height: 48, minHeight: 48, paddingHorizontal: 0, borderRadius: 14 },
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-10 min-h-[42px] rounded-xl px-4",
  default: "h-12 min-h-[48px] rounded-xl px-5",
  lg: "h-13 min-h-[52px] rounded-2xl px-6",
  icon: "size-12 min-h-[48px] min-w-[48px] rounded-xl",
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
 * Guarantees standard 48dp touch target without shrinking or collapsing.
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
  const cfg = SIZE_CONFIG[size];

  return (
    <Animated.View
      style={[
        animatedStyle,
        isFlex1 ? { flex: 1 } : undefined,
        isWFull ? { width: "100%" } : undefined,
        { minHeight: cfg.minHeight },
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
        style={[
          {
            minHeight: cfg.minHeight,
            height: cfg.height,
            paddingHorizontal: cfg.paddingHorizontal,
            borderRadius: cfg.borderRadius,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
        className={cn(
          "flex-row items-center justify-center gap-2",
          (isFlex1 || isWFull) && "w-full",
          SIZE_CLASSES[size],
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
                className={cn(size === "lg" ? "text-base font-bold" : "text-sm font-semibold", TEXT[variant])}
                style={{
                  letterSpacing: 0.1,
                  textAlign: "center",
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
