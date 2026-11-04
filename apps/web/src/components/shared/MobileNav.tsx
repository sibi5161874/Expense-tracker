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
import { useTranslation } from "@/contexts/LocaleContext";
import { TransactionForm } from "@/components/TransactionForm";
import type { TranslationKey } from "@repo/shared/i18n";

const MORE_LINKS: { href: string; labelKey: TranslationKey; icon: typeof LayoutDashboard }[] = [
  { href: "/reports", labelKey: "sidebar.group.reports", icon: FileBarChart },
  { href: "/investments", labelKey: "sidebar.investments", icon: TrendingUp },
  { href: "/goals", labelKey: "sidebar.goals", icon: Target },
  { href: "/cashbook", labelKey: "sidebar.cashbook", icon: Users },
  { href: "/insurance", labelKey: "sidebar.insurance", icon: ShieldCheck },
  { href: "/assets", labelKey: "sidebar.group.assets", icon: Landmark },
  { href: "/config", labelKey: "sidebar.group.config", icon: Cog },
  { href: "/settings", labelKey: "sidebar.group.settings", icon: Settings },
];

/**
 * Mobile-first bottom navigation bar:
 * Strictly structured 5-column grid ensuring zero overlap:
 * Col 1: Home (/dashboard)
 * Col 2: Activity (/transactions)
 * Col 3: Center Quick Add FAB (+) — clean raised action in its dedicated column
 * Col 4: Portfolio (/portfolio)
 * Col 5: More (bottom sheet with Reports, Goals, Investments, Settings, etc.)
 */
export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const moreActive = MORE_LINKS.some((l) => pathname.startsWith(l.href));

  async function handleSignOut() {
    setMoreOpen(false);
    await signOut();
    router.push("/login");
  }

  const isHomeActive = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isActivityActive = pathname.startsWith("/transactions");
  const isPortfolioActive = pathname.startsWith("/portfolio");

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/95 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid w-full max-w-md grid-cols-5 items-center">
          {/* Col 1: Home */}
          <Link
            href="/dashboard"
            className={cn(
              "flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[11px] font-medium transition-colors",
              isHomeActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutDashboard className="size-5" />
            <span>{t("nav.home")}</span>
          </Link>

          {/* Col 2: Activity */}
          <Link
            href="/transactions"
            className={cn(
              "flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[11px] font-medium transition-colors",
              isActivityActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowLeftRight className="size-5" />
            <span>{t("nav.activity")}</span>
          </Link>

          {/* Col 3: Center Quick Add Button (Dedicated Slot, Zero Overlap) */}
          <div className="flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              aria-label={t("nav.addTransaction")}
              className="flex size-12 -mt-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition-transform hover:bg-emerald-600 active:scale-95"
            >
              <Plus className="size-6 stroke-[2.5]" />
            </button>
            <span className="text-[10px] font-medium text-muted-foreground mt-0.5">Add</span>
          </div>

          {/* Col 4: Portfolio */}
          <Link
            href="/portfolio"
            className={cn(
              "flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[11px] font-medium transition-colors",
              isPortfolioActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <PieChart className="size-5" />
            <span>{t("sidebar.portfolio")}</span>
          </Link>

          {/* Col 5: More */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[11px] font-medium transition-colors",
              moreActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MoreHorizontal className="size-5" />
            <span>{t("nav.more")}</span>
          </button>
        </div>
      </nav>

      {quickAddOpen && (
        <TransactionForm onSuccess={() => setQuickAddOpen(false)} onCancel={() => setQuickAddOpen(false)} />
      )}

      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label={t("nav.closeMenu")}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMoreOpen(false)}
          />
          <div className="bg-card text-card-foreground absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-border/80 p-5 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Handle pill */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/25" />

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{t("nav.more")}</h2>
              <button
                aria-label={t("nav.close")}
                onClick={() => setMoreOpen(false)}
                className="text-muted-foreground flex size-9 items-center justify-center rounded-full hover:bg-muted active:scale-95"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {MORE_LINKS.map((link) => {
                const Icon = link.icon;
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-2xl p-2.5 text-center text-xs font-medium transition-colors",
                      active ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"
                    )}
                  >
                    <div className={cn("flex size-10 items-center justify-center rounded-xl", active ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      <Icon className="size-5" />
                    </div>
                    <span className="line-clamp-1">{t(link.labelKey)}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleSignOut}
                className="text-destructive hover:bg-destructive-subtle flex flex-col items-center gap-1.5 rounded-2xl p-2.5 text-center text-xs font-medium"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-destructive-subtle text-destructive">
                  <LogOut className="size-5" />
                </div>
                <span>{t("sidebar.signOut")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
