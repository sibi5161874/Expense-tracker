import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";

/**
 * Mirrors apps/web/src/components/ui/card.tsx — flat, rounded-2xl (16px), card/background
 * color contrast does the separating (no border, no shadow) per design spec §2.
 */
export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("rounded-2xl bg-card p-4", className)} {...props} />;
}
