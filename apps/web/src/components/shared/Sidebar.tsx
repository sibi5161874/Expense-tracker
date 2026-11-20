"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  PieChart,
  Target,
  Users,
  Landmark,
  LogOut,
  Wallet,
  Settings,
  FileBarChart,
  PiggyBank,
  Coins,
  HandCoins,
  ShieldCheck,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  Tags,
  Building2,
  Umbrella,
  Baby,
  Banknote,
  FileStack,
  User,
  SquareStack,
  Cog,
  Repeat,
  Home,
  CalendarClock,
  ScrollText,
  Car,
  Crown,
  Calculator,
  Coffee,
  MessageSquareHeart,
  HelpCircle,
  Bot,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import { useTranslation } from "@/contexts/LocaleContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { REPORTS, type ReportMeta } from "@/lib/reportsRegistry";
import { isReportEnabled } from "@repo/shared/logic";
import { APP_BRANDING } from "@repo/shared/config";
import type { TranslationKey } from "@repo/shared/i18n";

interface NavLeaf {
  href: string;
  /** English fallback, and the only label for dynamic report entries (never translated — see
   * `labelKey`). */
  label: string;
  /** When set, resolved via `t()` instead of `label` — every entry in this file's own static
   * taxonomy has one; only the report registry's dynamic titles fall back to `label`. */
  labelKey?: TranslationKey;
  icon?: typeof LayoutDashboard;
}

interface NavSubGroup {
  label: string;
  labelKey?: TranslationKey;
  items: NavLeaf[];
}

interface NavGroup {
  label: string;
  labelKey?: TranslationKey;
  icon: typeof LayoutDashboard;
  /** Every child, flat — still needed for "is a route inside this group active" checks even
   * when `subGroups` below is what actually renders. */
  children: NavLeaf[];
  /** When set, renders `children` under these labeled sub-headers instead of one flat list —
   * for a group whose child count makes a flat list hard to scan. Reuses the same category
   * taxonomy the `/reports` hub page already groups by, rather than inventing a new one. */
  subGroups?: NavSubGroup[];
}

type NavEntry = NavLeaf | NavGroup;

interface NavSection {
  id: string;
  label: string;
  entries: NavEntry[];
}

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

function navLabel(entry: { label: string; labelKey?: TranslationKey }, t: (key: TranslationKey) => string): string {
  return entry.labelKey ? t(entry.labelKey) : entry.label;
}

const ASSET_CHILDREN: NavLeaf[] = [
  { href: "/assets?tab=fd", label: "Fixed Deposits", labelKey: "sidebar.assets.fixedDeposits", icon: PiggyBank },
  { href: "/assets?tab=gold", label: "Gold", labelKey: "sidebar.assets.gold", icon: Coins },
  { href: "/assets?tab=loans", label: "Loans & Liabilities", labelKey: "sidebar.assets.loans", icon: HandCoins },
  { href: "/assets?tab=epf", label: "EPF", labelKey: "sidebar.assets.epf", icon: Building2 },
  { href: "/assets?tab=nps", label: "NPS", labelKey: "sidebar.assets.nps", icon: FileStack },
  { href: "/assets?tab=ssy", label: "SSY", labelKey: "sidebar.assets.ssy", icon: Baby },
  { href: "/assets?tab=sgb", label: "SGB", labelKey: "sidebar.assets.sgb", icon: Banknote },
  { href: "/assets?tab=ulip", label: "ULIP", labelKey: "sidebar.assets.ulip", icon: Umbrella },
  { href: "/assets?tab=realestate", label: "Real Estate", labelKey: "sidebar.assets.realEstate", icon: Home },
  { href: "/assets?tab=ppf", label: "PPF", labelKey: "sidebar.assets.ppf", icon: Landmark },
  { href: "/assets?tab=rd", label: "Recurring Deposits", labelKey: "sidebar.assets.recurringDeposits", icon: CalendarClock },
  { href: "/assets?tab=nsc", label: "NSC", labelKey: "sidebar.assets.nsc", icon: ScrollText },
  { href: "/assets?tab=vehicles", label: "Vehicles", labelKey: "sidebar.assets.vehicles", icon: Car },
  { href: "/assets?tab=crypto", label: "Crypto", labelKey: "sidebar.assets.crypto", icon: Coins },
];

const CONFIG_CHILDREN: NavLeaf[] = [
  { href: "/config?tab=accounts", label: "Accounts", labelKey: "sidebar.config.accounts", icon: Wallet },
  { href: "/config?tab=categories", label: "Categories & Sub-Categories", labelKey: "sidebar.config.categories", icon: Tags },
  { href: "/config?tab=budgets", label: "Budgets", labelKey: "sidebar.config.budgets", icon: SquareStack },
  { href: "/config?tab=recurring", label: "Recurring", labelKey: "sidebar.config.recurring", icon: Repeat },
  { href: "/config?tab=ai", label: "AI Bot (Groq)", icon: Bot },
];

const SETTINGS_CHILDREN: NavLeaf[] = [
  { href: "/settings?tab=profile", label: "Profile", labelKey: "sidebar.settings.profile", icon: User },
  { href: "/settings?tab=billing", label: "Billing", labelKey: "sidebar.settings.billing", icon: Crown },
  { href: "/settings?tab=preferences", label: "Preferences", labelKey: "sidebar.settings.preferences", icon: SlidersHorizontal },
  { href: "/settings?tab=data", label: "Data & Privacy", labelKey: "sidebar.settings.dataPrivacy", icon: ShieldCheck },
];

const HELP_CHILDREN: NavLeaf[] = [
  { href: "/help/donate", label: "Donate", labelKey: "sidebar.help.donate", icon: Coffee },
  { href: "/help/feedback", label: "Feedback", labelKey: "sidebar.help.feedback", icon: MessageSquareHeart },
];

const ENABLED_REPORTS = REPORTS.filter((r) => isReportEnabled(r.slug));
const REPORT_CHILDREN: NavLeaf[] = ENABLED_REPORTS.map((r) => ({ href: `/reports/${r.slug}`, label: r.title }));

const REPORT_CATEGORIES: ReportMeta["category"][] = ["Expense", "Investment", "Combined"];
const REPORT_CATEGORY_KEYS: Record<ReportMeta["category"], TranslationKey> = {
  Expense: "sidebar.reports.expense",
  Investment: "sidebar.reports.investment",
  Combined: "sidebar.reports.combined",
};
const REPORT_SUBGROUPS: NavSubGroup[] = REPORT_CATEGORIES.map((category) => ({
  label: category,
  labelKey: REPORT_CATEGORY_KEYS[category],
  items: ENABLED_REPORTS.filter((r) => r.category === category).map((r) => ({
    href: `/reports/${r.slug}`,
    label: r.title,
  })),
})).filter((group) => group.items.length > 0);

const NAV_SECTIONS: NavSection[] = [
  {
    id: "main",
    label: "Main",
    entries: [
      { href: "/dashboard", label: "Dashboard", labelKey: "sidebar.dashboard", icon: LayoutDashboard },
      { href: "/transactions", label: "Transactions", labelKey: "sidebar.transactions", icon: ArrowLeftRight },
      { href: "/investments", label: "Investments", labelKey: "sidebar.investments", icon: TrendingUp },
      { href: "/portfolio", label: "Portfolio", labelKey: "sidebar.portfolio", icon: PieChart },
      { href: "/calculators", label: "Calculators", labelKey: "sidebar.calculators", icon: Calculator },
      { href: "/goals", label: "Goals", labelKey: "sidebar.goals", icon: Target },
      { href: "/cashbook", label: "Cashbook", labelKey: "sidebar.cashbook", icon: Users },
      { href: "/insurance", label: "Insurance", labelKey: "sidebar.insurance", icon: ShieldCheck },
    ],
  },
  {
    id: "manage",
    label: "Manage",
    entries: [
      { label: "Assets", labelKey: "sidebar.group.assets", icon: Landmark, children: ASSET_CHILDREN },
      { label: "Reports", labelKey: "sidebar.group.reports", icon: FileBarChart, children: REPORT_CHILDREN, subGroups: REPORT_SUBGROUPS },
    ],
  },
  {
    id: "system",
    label: "System",
    entries: [
      { label: "Config", labelKey: "sidebar.group.config", icon: Cog, children: CONFIG_CHILDREN },
      { label: "Settings", labelKey: "sidebar.group.settings", icon: Settings, children: SETTINGS_CHILDREN },
      { label: "Help", labelKey: "sidebar.group.help", icon: HelpCircle, children: HELP_CHILDREN },
    ],
  },
];

const NAV_ENTRIES: NavEntry[] = NAV_SECTIONS.flatMap((s) => s.entries);

/** Matches href+query (e.g. `/assets?tab=gold`) against the current route, not just pathname. */
function useIsActive() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (href: string) => {
    const [path, query] = href.split("?");
    if (!query) return pathname.startsWith(path);
    const targetTab = new URLSearchParams(query).get("tab");
    return pathname === path && searchParams.get("tab") === targetTab;
  };
}

interface ActiveFlyoutState {
  group: NavGroup;
  rect: { top: number; right: number; bottom: number };
}

export function Sidebar() {
  const { user, signOut } = useAuth();
  const avatarUrl = useAvatarUrl();
  const router = useRouter();
  const isActive = useIsActive();
  const pathname = usePathname();
  const { t } = useTranslation();

  const [mounted, setMounted] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [activeFlyout, setActiveFlyout] = useState<ActiveFlyoutState | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Restore collapse preference and mark component mounted for portal
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only hydration
    setMounted(true);
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored) setCollapsed(stored === "true");
  }, []);

  // Global keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((prev) => {
          const next = !prev;
          localStorage.setItem("sidebar-collapsed", String(next));
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close flyout on window scroll or resize
  useEffect(() => {
    const handleScroll = () => setActiveFlyout(null);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Auto-open active group
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    const activeGroup = NAV_ENTRIES.find((entry) => isGroup(entry) && entry.children.some((c) => isActive(c.href)));
    if (activeGroup) {
      setOpenGroups((prev) => ({ ...prev, [activeGroup.label]: true }));
    }
  }

  function toggleCollapsed() {
    setActiveFlyout(null);
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  function toggleGroup(label: string) {
    if (collapsed) {
      setCollapsed(false);
      localStorage.setItem("sidebar-collapsed", "false");
      setOpenGroups((prev) => ({ ...prev, [label]: true }));
      setActiveFlyout(null);
      return;
    }
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function handleGroupMouseEnter(group: NavGroup, el: HTMLElement) {
    if (!collapsed) return;
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    const bRect = el.getBoundingClientRect();
    setActiveFlyout({
      group,
      rect: { top: bRect.top, right: bRect.right, bottom: bRect.bottom },
    });
  }

  function handleGroupMouseLeave() {
    if (!collapsed) return;
    leaveTimeoutRef.current = setTimeout(() => {
      setActiveFlyout(null);
    }, 180);
  }

  function handleFlyoutMouseEnter() {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }

  function handleFlyoutMouseLeave() {
    leaveTimeoutRef.current = setTimeout(() => {
      setActiveFlyout(null);
    }, 180);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";

  function renderChildLink(child: NavLeaf) {
    const active = isActive(child.href);
    const ChildIcon = child.icon;
    return (
      <Link
        key={child.href}
        href={child.href}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
          active
            ? "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/18 dark:text-emerald-400 font-semibold"
            : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground font-medium"
        )}
      >
        {ChildIcon && (
          <ChildIcon
            className={cn(
              "size-3.5 shrink-0",
              active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
            )}
          />
        )}
        <span className="truncate">{navLabel(child, t)}</span>
      </Link>
    );
  }

  function renderFlyoutChildLink(child: NavLeaf) {
    const active = isActive(child.href);
    const ChildIcon = child.icon;
    return (
      <Link
        key={child.href}
        href={child.href}
        onClick={() => setActiveFlyout(null)}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
          active
            ? "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/18 dark:text-emerald-400 font-semibold"
            : "text-muted-foreground hover:bg-accent/80 hover:text-foreground font-medium"
        )}
      >
        {ChildIcon && (
          <ChildIcon
            className={cn(
              "size-3.5 shrink-0",
              active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
            )}
          />
        )}
        <span className="truncate">{navLabel(child, t)}</span>
      </Link>
    );
  }

  return (
    <>
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground relative hidden shrink-0 flex-col border-r border-sidebar-border transition-all duration-200 ease-in-out md:flex",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Header / Brand */}
        <div className={cn("flex items-center py-4 border-b border-sidebar-border/40", collapsed ? "justify-center px-0 w-full" : "px-5 gap-2")}>
          <Link
            href="/"
            className={cn(
              "flex items-center group transition-transform",
              collapsed ? "justify-center w-full" : "min-w-0 flex-1 gap-2.5"
            )}
            title={APP_BRANDING.name}
          >
            <Image
              src={APP_BRANDING.logoUrl}
              alt={APP_BRANDING.name}
              width={32}
              height={32}
              className="size-8 shrink-0 rounded-xl transition-transform group-hover:scale-105"
            />
            {!collapsed && (
              <span className="flex-1 truncate text-base font-bold tracking-tight text-foreground">
                {APP_BRANDING.name}
              </span>
            )}
          </Link>

          {!collapsed && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label={t("sidebar.collapseSidebar")}
                  className="text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 shrink-0 rounded-lg p-1.5 transition-colors"
                >
                  <PanelLeftClose className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8} className="text-xs">
                {t("sidebar.collapseSidebar")} <span className="opacity-60 text-[10px] ml-1">Ctrl+B</span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="scrollbar-hide flex-1 space-y-4 overflow-y-auto px-3 py-3">
          {NAV_SECTIONS.map((section, idx) => (
            <div key={section.id} className="space-y-1">
              {/* Section Header or Divider */}
              {!collapsed ? (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/45">
                  {section.label}
                </div>
              ) : idx > 0 ? (
                <div className="my-2 mx-1 h-px bg-sidebar-border/60" />
              ) : null}

              {/* Section Items */}
              <div className="space-y-1">
                {section.entries.map((entry) => {
                  if (!isGroup(entry)) {
                    const active = isActive(entry.href);
                    const Icon = entry.icon!;
                    const label = navLabel(entry, t);

                    if (collapsed) {
                      return (
                        <div key={entry.href} className="flex justify-center">
                          <Tooltip delayDuration={50}>
                            <TooltipTrigger asChild>
                              <Link
                                href={entry.href}
                                aria-label={label}
                                className={cn(
                                  "flex size-10 items-center justify-center rounded-xl transition-all",
                                  active
                                    ? "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-semibold shadow-xs"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                                )}
                              >
                                <Icon className="size-4.5 shrink-0" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={12} className="text-xs font-medium">
                              {label}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={entry.href}
                        href={entry.href}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/18 dark:text-emerald-400 font-semibold shadow-xs"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground font-medium"
                        )}
                      >
                        {active && (
                          <span className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-emerald-500" />
                        )}
                        <Icon
                          className={cn(
                            "size-4.5 shrink-0",
                            active ? "text-emerald-600 dark:text-emerald-400" : ""
                          )}
                        />
                        <span className="truncate">{label}</span>
                      </Link>
                    );
                  }

                  // Group Entry (Assets, Reports, Config, Settings, Help)
                  const GroupIcon = entry.icon;
                  const isOpen = !collapsed && !!openGroups[entry.label];
                  const groupHasActive = entry.children.some((c) => isActive(c.href));
                  const label = navLabel(entry, t);

                  if (collapsed) {
                    const isFlyoutOpen = activeFlyout?.group.label === entry.label;
                    return (
                      <div key={entry.label} className="flex justify-center">
                        <button
                          type="button"
                          onMouseEnter={(e) => handleGroupMouseEnter(entry, e.currentTarget)}
                          onMouseLeave={handleGroupMouseLeave}
                          onClick={() => toggleGroup(entry.label)}
                          aria-label={label}
                          className={cn(
                            "relative flex size-10 items-center justify-center rounded-xl transition-all",
                            groupHasActive
                              ? "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-semibold shadow-xs"
                              : isFlyoutOpen
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <GroupIcon className="size-4.5 shrink-0" />
                          {groupHasActive && (
                            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
                          )}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={entry.label}>
                      <button
                        type="button"
                        onClick={() => toggleGroup(entry.label)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                          groupHasActive
                            ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground font-medium"
                        )}
                      >
                        <GroupIcon
                          className={cn(
                            "size-4.5 shrink-0",
                            groupHasActive ? "text-emerald-600 dark:text-emerald-400" : ""
                          )}
                        />
                        <span className="flex-1 text-left truncate">{label}</span>
                        <ChevronDown
                          className={cn(
                            "size-3.5 shrink-0 transition-transform duration-200",
                            isOpen && "rotate-180"
                          )}
                        />
                      </button>

                      {isOpen && (
                        <div className="mt-1 ml-4 space-y-0.5 border-l border-sidebar-border/70 pl-3">
                          {entry.subGroups
                            ? entry.subGroups.map((sub) => (
                                <div key={sub.label} className="mb-2 last:mb-0">
                                  <p className="text-sidebar-foreground/40 px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider">
                                    {navLabel(sub, t)}
                                  </p>
                                  {sub.items.map((child) => renderChildLink(child))}
                                </div>
                              ))
                            : entry.children.map((child) => renderChildLink(child))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Area: Collapse button + User Profile */}
        <div className={cn("border-sidebar-border/60 border-t py-3 space-y-2", collapsed ? "px-2" : "px-3")}>
          {collapsed && (
            <div className="flex justify-center pb-1">
              <Tooltip delayDuration={50}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleCollapsed}
                    aria-label={t("sidebar.expandSidebar")}
                    className="flex size-10 items-center justify-center rounded-xl text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  >
                    <PanelLeftOpen className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="text-xs">
                  {t("sidebar.expandSidebar")} <span className="opacity-60 text-[10px] ml-1">Ctrl+B</span>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          <div className={cn("flex items-center gap-3 rounded-xl", collapsed ? "justify-center" : "px-2.5 py-1.5 bg-sidebar-accent/30")}>
            {collapsed ? (
              <Tooltip delayDuration={50}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setShowSignOutConfirm(true)}
                    className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Avatar className="size-9 border border-sidebar-border">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12} className="text-xs">
                  <p className="font-semibold">{user?.email}</p>
                  <p className="text-[10px] text-muted-foreground pt-0.5">Click to sign out</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                <Avatar className="size-8.5 shrink-0 border border-sidebar-border">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSignOutConfirm(true)}
                  aria-label={t("sidebar.signOut")}
                  title={t("sidebar.signOut")}
                  className="text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-lg p-1.5 transition-colors"
                >
                  <LogOut className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <ConfirmDialog
          open={showSignOutConfirm}
          onOpenChange={setShowSignOutConfirm}
          title="Sign out?"
          description="You'll need to log back in to see your data again."
          confirmLabel="Sign out"
          destructive={false}
          onConfirm={handleSignOut}
        />
      </aside>

      {/* Floating Sub-Menu Flyout (Portal to document.body so it is never clipped) */}
      {mounted &&
        collapsed &&
        activeFlyout &&
        createPortal(
          <div
            onMouseEnter={handleFlyoutMouseEnter}
            onMouseLeave={handleFlyoutMouseLeave}
            style={{
              top: `${Math.max(12, Math.min(activeFlyout.rect.top - 10, window.innerHeight - 380))}px`,
              left: `${activeFlyout.rect.right + 8}px`,
            }}
            className="fixed z-50 w-60 rounded-2xl border border-border/80 bg-popover/95 p-2.5 text-popover-foreground shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150"
          >
            {/* Invisible hover bridge connecting trigger button to flyout */}
            <div className="absolute -left-3 top-0 w-3 h-full" />

            {/* Flyout Header */}
            <div className="flex items-center gap-2 px-2 pb-2 mb-1.5 border-b border-border/60">
              <div className="p-1 rounded-md bg-primary/10 text-primary">
                <activeFlyout.group.icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-foreground truncate">
                  {navLabel(activeFlyout.group, t)}
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  {activeFlyout.group.children.length} options
                </p>
              </div>
            </div>

            {/* Flyout Items list */}
            <div className="max-h-[min(26rem,calc(100vh-8rem))] overflow-y-auto space-y-0.5 pr-0.5 scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {activeFlyout.group.subGroups ? (
                activeFlyout.group.subGroups.map((sub) => (
                  <div key={sub.label} className="mb-2 last:mb-0">
                    <p className="px-2 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      {navLabel(sub, t)}
                    </p>
                    {sub.items.map((child) => renderFlyoutChildLink(child))}
                  </div>
                ))
              ) : (
                activeFlyout.group.children.map((child) => renderFlyoutChildLink(child))
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
