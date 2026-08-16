"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  FileBarChart,
  MoreHorizontal,
  TrendingUp,
  Target,
  Users,
  ShieldCheck,
  Landmark,
  Cog,
  Settings,
  LogOut,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Fab } from "@/components/ui/fab";
import { TransactionForm } from "@/components/TransactionForm";

const PRIMARY_LINKS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Activity", icon: ArrowLeftRight },
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/reports", label: "Reports", icon: FileBarChart },
];

const MORE_LINKS = [
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/cashbook", label: "Cashbook", icon: Users },
  { href: "/insurance", label: "Insurance", icon: ShieldCheck },
  { href: "/assets", label: "Assets", icon: Landmark },
  { href: "/config", label: "Config", icon: Cog },
  { href: "/settings", label: "Settings", icon: Settings },
];

/**
 * Mobile-first floating bottom nav (design spec §5C): translucent glass pill, 4 primary
 * destinations + a "More" tab that opens a bottom sheet for everything else, plus a FAB
 * for the single most common action (add transaction). Hidden at `md:` and up, where the
 * desktop Sidebar takes over.
 */
export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const moreActive = MORE_LINKS.some((l) => pathname.startsWith(l.href));

  async function handleSignOut() {
    setMoreOpen(false);
    await signOut();
    router.push("/login");
  }

  return (
    <>
      <nav className="glass-surface fixed inset-x-2 bottom-2 z-30 flex items-center justify-around rounded-2xl border border-border/60 px-1 py-2 md:hidden">
        {PRIMARY_LINKS.map((link) => {
          const active = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] font-medium transition-colors",
                active ? "text-accent2" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5 text-current" />
              {link.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] font-medium transition-colors",
            moreActive ? "text-accent2" : "text-muted-foreground"
          )}
        >
          <MoreHorizontal className="size-5 text-current" />
          More
        </button>
      </nav>

      <Fab
        className="bottom-24 md:hidden"
        aria-label="Add transaction"
        onClick={() => setQuickAddOpen(true)}
      >
        <Plus className="size-6" />
      </Fab>

      {quickAddOpen && (
        <TransactionForm onSuccess={() => setQuickAddOpen(false)} onCancel={() => setQuickAddOpen(false)} />
      )}

      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          <div className="bg-card text-card-foreground absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl p-4 pb-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">More</h2>
              <button
                aria-label="Close"
                onClick={() => setMoreOpen(false)}
                className="text-muted-foreground rounded-full p-1.5 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MORE_LINKS.map((link) => {
                const Icon = link.icon;
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-xs font-medium",
                      active ? "bg-accent2/15 text-accent2" : "text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="size-5 text-current" />
                    {link.label}
                  </Link>
                );
              })}
              <button
                onClick={handleSignOut}
                className="text-destructive hover:bg-destructive-subtle flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-xs font-medium"
              >
                <LogOut className="size-5 text-current" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
