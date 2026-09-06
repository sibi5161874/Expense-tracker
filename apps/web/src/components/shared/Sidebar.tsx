"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { REPORTS, type ReportMeta } from "@/lib/reportsRegistry";
import { isReportEnabled } from "@repo/shared/logic";
import { APP_BRANDING } from "@repo/shared/config";

interface NavLeaf {
  href: string;
  label: string;
  icon?: typeof LayoutDashboard;
}

interface NavSubGroup {
  label: string;
  items: NavLeaf[];
}

interface NavGroup {
  label: string;
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

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

const ASSET_CHILDREN: NavLeaf[] = [
  { href: "/assets?tab=fd", label: "Fixed Deposits", icon: PiggyBank },
  { href: "/assets?tab=gold", label: "Gold", icon: Coins },
  { href: "/assets?tab=loans", label: "Loans & Liabilities", icon: HandCoins },
  { href: "/assets?tab=epf", label: "EPF", icon: Building2 },
  { href: "/assets?tab=nps", label: "NPS", icon: FileStack },
  { href: "/assets?tab=ssy", label: "SSY", icon: Baby },
  { href: "/assets?tab=sgb", label: "SGB", icon: Banknote },
  { href: "/assets?tab=ulip", label: "ULIP", icon: Umbrella },
  { href: "/assets?tab=realestate", label: "Real Estate", icon: Home },
  { href: "/assets?tab=ppf", label: "PPF", icon: Landmark },
  { href: "/assets?tab=rd", label: "Recurring Deposits", icon: CalendarClock },
  { href: "/assets?tab=nsc", label: "NSC", icon: ScrollText },
  { href: "/assets?tab=vehicles", label: "Vehicles", icon: Car },
];

const CONFIG_CHILDREN: NavLeaf[] = [
  { href: "/config?tab=accounts", label: "Accounts", icon: Wallet },
  { href: "/config?tab=categories", label: "Categories & Sub-Categories", icon: Tags },
  { href: "/config?tab=budgets", label: "Budgets", icon: SquareStack },
  { href: "/config?tab=recurring", label: "Recurring", icon: Repeat },
];

const SETTINGS_CHILDREN: NavLeaf[] = [
  { href: "/settings?tab=profile", label: "Profile", icon: User },
  { href: "/settings?tab=billing", label: "Billing", icon: Crown },
  { href: "/settings?tab=preferences", label: "Preferences", icon: SlidersHorizontal },
  { href: "/settings?tab=data", label: "Data & Privacy", icon: ShieldCheck },
];

const HELP_CHILDREN: NavLeaf[] = [
  { href: "/help/donate", label: "Donate", icon: Coffee },
  { href: "/help/feedback", label: "Feedback", icon: MessageSquareHeart },
];

const ENABLED_REPORTS = REPORTS.filter((r) => isReportEnabled(r.slug));
const REPORT_CHILDREN: NavLeaf[] = ENABLED_REPORTS.map((r) => ({ href: `/reports/${r.slug}`, label: r.title }));

const REPORT_CATEGORIES: ReportMeta["category"][] = ["Expense", "Investment", "Combined"];
const REPORT_SUBGROUPS: NavSubGroup[] = REPORT_CATEGORIES.map((category) => ({
  label: category,
  items: ENABLED_REPORTS.filter((r) => r.category === category).map((r) => ({
    href: `/reports/${r.slug}`,
    label: r.title,
  })),
})).filter((group) => group.items.length > 0);

const NAV_ENTRIES: NavEntry[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/calculators", label: "Calculators", icon: Calculator },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/cashbook", label: "Cashbook", icon: Users },
  { href: "/insurance", label: "Insurance", icon: ShieldCheck },
  { label: "Assets", icon: Landmark, children: ASSET_CHILDREN },
  { label: "Reports", icon: FileBarChart, children: REPORT_CHILDREN, subGroups: REPORT_SUBGROUPS },
  { label: "Config", icon: Cog, children: CONFIG_CHILDREN },
  { label: "Settings", icon: Settings, children: SETTINGS_CHILDREN },
  { label: "Help", icon: HelpCircle, children: HELP_CHILDREN },
];

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

export function Sidebar() {
  const { user, signOut } = useAuth();
  const avatarUrl = useAvatarUrl();
  const router = useRouter();
  const isActive = useIsActive();
  const pathname = usePathname();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // localStorage only exists client-side, so restoring the saved collapse preference has to
  // happen in an effect (React's own documented use for one — synchronizing with an external
  // system) rather than during render.
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
    if (stored) setCollapsed(stored === "true");
  }, []);

  // Auto-open whichever group contains the active route. Unlike the localStorage read above,
  // everything this needs (pathname, NAV_ENTRIES, isActive) is already available during
  // render, so this uses React's documented "adjusting state when a prop changes" pattern —
  // comparing against the last-seen pathname and calling setState conditionally — instead of
  // an effect, tracking its own lastPathname rather than relying on openGroups being absent
  // so a user's manual collapse of that group afterwards is never re-opened by this check.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    const activeGroup = NAV_ENTRIES.find((entry) => isGroup(entry) && entry.children.some((c) => isActive(c.href)));
    if (activeGroup) {
      setOpenGroups((prev) => ({ ...prev, [activeGroup.label]: true }));
    }
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
    });
  }

  function toggleGroup(label: string) {
    if (collapsed) {
      setCollapsed(false);
      localStorage.setItem("sidebar-collapsed", "false");
      setOpenGroups((prev) => ({ ...prev, [label]: true }));
      return;
    }
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
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
          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        )}
      >
        {ChildIcon && <ChildIcon className="size-3.5 shrink-0" />}
        <span className="truncate">{child.label}</span>
      </Link>
    );
  }

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground relative hidden shrink-0 flex-col border-r border-sidebar-border transition-all duration-200 md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("flex items-center gap-2 py-5", collapsed ? "justify-center px-3" : "px-6")}>
        <Image src={APP_BRANDING.logoUrl} alt={APP_BRANDING.name} width={32} height={32} className="size-8 shrink-0 rounded-lg" />
        {!collapsed && <span className="flex-1 truncate text-lg font-semibold">{APP_BRANDING.name}</span>}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 shrink-0 rounded-md p-1.5",
            collapsed && "absolute -right-3 top-6 bg-sidebar border border-sidebar-border"
          )}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      <nav className="scrollbar-hide flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {NAV_ENTRIES.map((entry) => {
          if (!isGroup(entry)) {
            const active = isActive(entry.href);
            const Icon = entry.icon!;
            return (
              <Link
                key={entry.href}
                href={entry.href}
                title={collapsed ? entry.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4.5 shrink-0" />
                {!collapsed && entry.label}
              </Link>
            );
          }

          const GroupIcon = entry.icon;
          const isOpen = !collapsed && !!openGroups[entry.label];
          const groupHasActive = entry.children.some((c) => isActive(c.href));

          return (
            <div key={entry.label}>
              <button
                onClick={() => toggleGroup(entry.label)}
                title={collapsed ? entry.label : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  groupHasActive
                    ? "text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <GroupIcon className="size-4.5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{entry.label}</span>
                    <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", isOpen && "rotate-180")} />
                  </>
                )}
              </button>

              {isOpen && (
                <div className="mt-1 ml-4 space-y-0.5 border-l border-sidebar-border pl-3">
                  {entry.subGroups
                    ? entry.subGroups.map((sub) => (
                        <div key={sub.label} className="mb-2 last:mb-0">
                          <p className="text-sidebar-foreground/40 px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wide uppercase">
                            {sub.label}
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
      </nav>

      <div className={cn("border-sidebar-border border-t py-4", collapsed ? "px-2" : "px-3")}>
        <div className={cn("flex items-center gap-3 rounded-lg px-3 py-2", collapsed && "justify-center px-0")}>
          <Avatar>
            {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="text-sidebar-foreground/60 hover:text-sidebar-accent-foreground rounded-md p-1.5 hover:bg-sidebar-accent/60"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
