import { Text, type TextProps } from "react-native";
import { cn } from "@/lib/cn";
import { fontFamily } from "@/theme/tokens";

/**
 * Base text primitive — every screen composes on top of this rather than raw RN <Text>.
 * Defaults to Inter Regular; pass style={{ fontFamily: fontFamily.semibold }} (etc, from
 * theme/tokens.ts) for heavier weights rather than RN's font-weight numbers, which Inter's
 * loaded static weights don't respond to the way a system font does.
 */
export function AppText({ className, style, ...props }: TextProps & { className?: string }) {
  return (
    <Text
      className={cn("text-foreground", className)}
      style={[{ fontFamily: fontFamily.regular }, style]}
      {...props}
    />
  );
}
