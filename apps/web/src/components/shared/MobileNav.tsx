"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  PieChart,
  Target,
  Users,
  Landmark,
  Settings,
  FileBarChart,
  ShieldCheck,
  Cog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/cashbook", label: "Cashbook", icon: Users },
  { href: "/insurance", label: "Insurance", icon: ShieldCheck },
  { href: "/assets", label: "Assets", icon: Landmark },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/config", label: "Config", icon: Cog },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="border-border bg-background flex gap-1 overflow-x-auto border-b px-3 py-2 md:hidden">
      {NAV_LINKS.map((link) => {
        const isActive = pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
