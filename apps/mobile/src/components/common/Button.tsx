import type { ReactNode } from "react";
import { Pressable, type PressableProps } from "react-native";
import { AppText } from "@/components/common/AppText";
import { cn } from "@/lib/cn";

type Variant = "default" | "outline" | "ghost" | "destructive";

const CONTAINER: Record<Variant, string> = {
  default: "bg-primary active:bg-primary/80",
  outline: "border border-border bg-background active:bg-muted",
  ghost: "active:bg-muted",
  destructive: "bg-destructive/10 active:bg-destructive/20",
};

const TEXT: Record<Variant, string> = {
  default: "text-primary-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
  destructive: "text-destructive",
};

interface ButtonProps extends PressableProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

/** Mirrors apps/web/src/components/ui/button.tsx's variant set (default/outline/ghost/destructive). */
export function Button({ variant = "default", children, className, disabled, ...props }: ButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      className={cn(
        "h-11 flex-row items-center justify-center gap-1.5 rounded-2xl px-4",
        CONTAINER[variant],
        disabled && "opacity-50",
        className
      )}
      {...props}
    >
      {typeof children === "string" ? (
        <AppText className={cn("text-sm font-medium", TEXT[variant])}>{children}</AppText>
      ) : (
        children
      )}
    </Pressable>
  );
}
