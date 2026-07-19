import { Text, type TextProps } from "react-native";
import { cn } from "@/lib/cn";

/** Base text primitive — every screen composes on top of this rather than raw RN <Text>. */
export function AppText({ className, ...props }: TextProps & { className?: string }) {
  return <Text className={cn("text-foreground", className)} {...props} />;
}
