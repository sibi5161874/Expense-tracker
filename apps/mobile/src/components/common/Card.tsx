import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";

/** Mirrors apps/web/src/components/ui/card.tsx — bg-card, border-border, rounded-xl. */
export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("rounded-xl border border-border bg-card p-4", className)} {...props} />;
}
