"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BottomNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Floating bottom navigation per design spec §5C: not a solid heavy bar — a translucent
 * glass pill with icon + label tabs, mx-2 inset from the screen edges, active tab in the
 * secondary (purple) accent color.
 */
export function BottomNav({ items, className }: { items: BottomNavItem[]; className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "glass-surface fixed inset-x-2 bottom-2 z-30 flex items-center justify-around rounded-2xl border border-border/60 px-1 py-2 sm:hidden",
        className
      )}
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] font-medium transition-colors",
              active ? "text-accent2" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5 text-current" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
