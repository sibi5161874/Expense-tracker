# UI Spec — Exact Values, Per Screen

No abstractions below — every value is literal. Hand a screen's section
directly to Claude Code as-is.

---

## 0. Global Tokens (put in `globals.css`)

```css
:root {
  --background: oklch(98% 0.01 85);        /* warm ivory, not pure white */
  --foreground: oklch(20% 0.02 60);        /* warm charcoal, not pure black */
  --card: oklch(98% 0.01 85);              /* same as background — cards are flush, not boxed-looking */
  --muted: oklch(94% 0.015 80);
  --muted-foreground: oklch(45% 0.02 70);
  --border: oklch(90% 0.01 80);

  --primary: oklch(58% 0.13 65);           /* brass/amber, hue ~65 */
  --primary-foreground: oklch(98% 0.01 85);

  --success: oklch(55% 0.15 145);          /* green, hue ~145 — distinct from primary */
  --destructive: oklch(55% 0.19 25);       /* red, hue ~25 */
  --warning: oklch(65% 0.15 85);           /* amber-yellow, hue ~85 */
  --info: oklch(55% 0.12 250);             /* blue, hue ~250 */

  --chart-1: oklch(60% 0.14 65);   /* primary brass */
  --chart-2: oklch(60% 0.12 200);  /* teal */
  --chart-3: oklch(60% 0.14 320);  /* plum */
  --chart-4: oklch(65% 0.13 40);   /* terracotta */
  --chart-5: oklch(55% 0.10 150);  /* olive */

  --radius: 0.85rem;
}

.dark {
  --background: oklch(16% 0.015 60);
  --foreground: oklch(95% 0.01 85);
  --card: oklch(16% 0.015 60);
  --muted: oklch(22% 0.02 60);
  --muted-foreground: oklch(65% 0.02 70);
  --border: oklch(26% 0.02 60);
  --primary: oklch(68% 0.14 65);
  /* success/destructive/warning/info: same hues, lightness raised ~10% for dark bg contrast */
}
```

**Typography:**
- Display (hero numbers only): `font-family: Fraunces` via `next/font/google`, weight 500, `font-feature-settings: "opsz" 40`
- Body: system default (Inter or `next/font` default) — do not add a second display font
- Numeric (every amount, no exceptions): `font-family: Geist Mono`, `font-variant-numeric: tabular-nums`

**Type scale (exact Tailwind classes to use, don't invent others):**
| Use | Class |
|---|---|
| Hero number | `text-6xl md:text-8xl font-display font-medium tracking-tight leading-none` |
| Page title | `text-2xl font-semibold tracking-tight` |
| Section heading | `text-sm font-semibold uppercase tracking-wide text-muted-foreground` |
| Body text | `text-sm` |
| Caption / label | `text-xs uppercase tracking-wide text-muted-foreground` |
| Table numeric cell | `font-mono tabular-nums text-sm text-right` |

**Spacing (exact, use these consistently, don't improvise new gaps):**
- Page container padding: `px-6 py-8 md:px-10 md:py-10`
- Between major page sections: `space-y-8`
- Inside a divided stat strip: `divide-x divide-border`, each stat `px-6 py-4`
- Table cell padding: `px-4 py-3`

---

## 1. App Shell (Sidebar + Nav) — decisive call

**Keep the left sidebar** (9+ sections justifies persistent nav for a finance app used daily) but strip the generic-admin-template treatment:

```
Sidebar container: w-64 border-r border-border bg-background (NOT a different
  shade from main content — no boxed-panel look)
Logo row: px-6 py-6, text-lg font-semibold
Nav item (inactive): flex items-center gap-3 px-6 py-2.5 text-sm text-muted-foreground
  hover:text-foreground hover:bg-muted/50 rounded-none — NO pill/rounded background
Nav item (active): same as above + border-l-2 border-primary -ml-[2px]
  bg-muted/30 text-foreground font-medium
  — active state is a thin left accent bar + subtle tint, NOT a filled rounded pill
Icons: size-4, no background container, no circle
User row (bottom): px-6 py-4 border-t border-border, avatar size-8 rounded-full
```

Explicitly banned: rounded pill backgrounds on nav items, icon badges with colored circles, a sidebar background color that's visually a separate "panel" from the content area.

---

## 2. Dashboard (`/dashboard`) — already approved, keep as reference

```
Hero: no Card wrapper. Label: text-xs uppercase tracking-wide text-muted-foreground
  mb-1. Number: text-6xl md:text-8xl font-display, colored by sign
  (text-success or text-destructive if negative, text-foreground if net-worth positive-neutral).
Sub-stats below hero: flex divide-x divide-border, each item px-6 first:pl-0,
  label text-xs uppercase text-muted-foreground, value font-mono tabular-nums text-lg mt-1.

KPI strip (Income/Expense/Savings/Rate): single container
  bg-muted/40 rounded-2xl divide-x divide-border grid grid-cols-4.
  Each cell p-5. Icon: size-3.5 inline before label, no background, no circle.
  Value: font-mono tabular-nums text-2xl font-semibold, colored by sign.

Charts: Recharts, no Card wrapper needed if chart has its own breathing room —
  OR light Card (bg-card border border-border rounded-2xl p-6) if it needs visual separation from hero above. Use Card here since two charts sit side by side.

Secondary row (Budget Health / Goals / Quick Stats): these ARE Card-appropriate
  since they're 3 independent, differently-shaped content units —
  Card className="rounded-2xl border-border p-6"
```

---

## 3. Transactions (`/transactions`) — pattern: editorial list, not table-in-card

```
Filter bar (above list, not boxed): flex items-center gap-3 mb-6
  — Select components for category/type/account filters, DatePicker for range,
  all inline, no surrounding container/card.

List (not a shadcn Table — a plain list):
  <div className="divide-y divide-border">
    Each row: flex items-center justify-between py-3.5 px-2 hover:bg-muted/30
    Left: category icon (size-4, muted) + category name (text-sm font-medium)
      + subcategory/notes (text-xs text-muted-foreground) stacked
    Right: date (text-xs text-muted-foreground) + amount
      (font-mono tabular-nums text-sm, text-success if Income, text-destructive if Expense)

Pagination: bottom, plain text buttons "Previous / Page 2 of 12 / Next",
  not a boxed pagination component.

Add/Edit form: shadcn Dialog or Sheet (slide-over from right), NOT inline —
  keeps the list clean. Sheet width: sm:max-w-md.
```

---

## 4. Investment Log (`/investments`)

Same `editorial-list` pattern as Transactions. Row content differs:
```
Left: symbol (text-sm font-semibold) + action badge
  (Badge variant="outline", text uppercase text-xs, e.g. "BUY"/"SIP"/"DIVIDEND")
Right: date + amount, same font-mono tabular-nums treatment,
  color: text-destructive for BUY/SIP (cash out), text-success for SELL/DIVIDEND (cash in)
```

---

## 5. Portfolio (`/portfolio`)

```
Top: hero-divided pattern, same structure as Dashboard's Net Worth —
  hero = Current Value, sub-stats = Total Invested / P&L / Return %.

Holdings table: command-bar-table pattern.
  Filter/sort bar above (asset type filter, sort dropdown) — plain inline, no card.
  Table: shadcn Table component, but:
    TableHeader: bg-transparent border-b-2 border-border,
      TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-medium"
    TableRow: odd:bg-transparent even:bg-muted/40 (zebra), border-b border-border/50
    Numeric TableCell: className="font-mono tabular-nums text-right"
    NO card wrapper around the table — it sits directly on the page background.

Allocation chart: Card wrapper OK here (bg-card border border-border rounded-2xl p-6),
  positioned side-by-side with the table on desktop (grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6).
```

---

## 6. Goals (`/goals`) — pattern: bento-asymmetric

```
Grid: grid grid-cols-1 md:grid-cols-3 gap-4
  Highest-priority goal (or nearest target date): spans 2 columns, larger card
    Card className="md:col-span-2 rounded-2xl p-6"
    Progress bar: Progress component, but restyle track to bg-muted, indicator
      colored by status (bg-success if on-track, bg-warning if behind, bg-destructive if overdue)
  Remaining goals: standard single-column cards, same Card styling, smaller
    padding (p-5), progress bar same treatment.
Each goal card: name (text-base font-semibold), target date (text-xs text-muted-foreground),
  amounts as "₹saved / ₹target" in font-mono tabular-nums text-sm below the progress bar.
```

---

## 7. Cashbook (`/cashbook`)

```
Top: hero-divided — hero number = Net Position (sum across all counterparties),
  colored text-success if net positive (owed to you), text-destructive if negative.

Per-person list: editorial-list pattern, NOT cards.
  Each row: name (text-sm font-medium) + status Badge
    ("Owes You" variant="outline" className="text-success border-success/40",
     "You Owe" className="text-destructive border-destructive/40",
     "Settled" variant="secondary")
  Right-aligned: net amount, font-mono tabular-nums, colored by sign.
  Overdue: add a small AlertTriangle icon (size-3.5, text-warning) before the amount.
```

---

## 8. Assets (`/assets`)

```
Three sections (Fixed Deposits / Gold / Loans), each its own command-bar-table:
  Section heading: text-sm font-semibold uppercase tracking-wide text-muted-foreground,
    mb-3, with a "+ Add" Button (variant="ghost", size="sm") right-aligned in the same row.
  Table: same zebra/header treatment as Portfolio's Holdings table.
  FD rows: maturity date cell gets a Badge if within 30 days
    ("Maturing Soon", variant="outline", className="text-warning border-warning/40").
```

---

## 9. Reports (`/reports`) — needs a first pass, not just propagation

```
Report type selector: not a dropdown buried in a form — use a horizontal
  Tabs component (shadcn Tabs) grouped by category (Expense / Investment / Combined)
  at the top of the page, tabs styled: no boxed active-tab background,
  just border-b-2 border-primary on active tab text.

Date range (for period reports): inline DatePicker range, top-right of the
  content area, not a separate form section.

Report content area: reuses whatever the module (chart/table) needs —
  apply the same rules as the equivalent screen above (e.g., a category
  breakdown report reuses Dashboard's chart treatment, a holdings report
  reuses Portfolio's table treatment). Don't invent new component styling here.
```

---

## 10. Settings (`/settings`)

```
Lowest priority — minimal spec: Tabs component (Accounts / Budgets / Categories),
  each tab content a plain editorial-list of rows with inline edit
  (click row → fields become editable, or a Sheet slide-over for add/edit —
  consistent with Transactions' form pattern). No special treatment needed
  beyond matching the list pattern already used elsewhere.
```

---

## 11. Amendments (established in later sessions — supersede conflicting rules above)

Sections 0–10 above are the *original* spec this app was built from. Several decisions
made later in chat never made it back into this file and would otherwise only exist in
conversation history. Recorded here so they survive past that history.

**Tables — DataTable is now the standard, not a plain list or a raw shadcn `Table`.**
`apps/web/src/components/shared/DataTable.tsx` is the canonical component for any
tabular list with real row-level interaction (search, filter, sort, pagination, and/or
row selection). It supersedes section 3's "plain list, not shadcn Table" call for
Transactions, and section 5's "raw Table directly on the page" call for Portfolio's
Holdings table — both now use `DataTable`. It's in use on Transactions, Investment Log,
Cashbook, and every report page that renders a data table. A raw `<Table>` is still fine
for content that's genuinely static display only (e.g. a 2-column totals summary) where
none of DataTable's interactive features apply.

**Sidebar — Settings and Config are now sidebar sub-nav groups, not tab bars.**
Settings split into two sidebar groups: **Settings** (Profile, Preferences) and **Config**
(Accounts, Categories, Budgets) — supersedes section 10 entirely. Assets' sidebar group
now lists all 8 asset types (Fixed Deposits, Gold, Loans & Liabilities, EPF, NPS, SSY,
SGB, ULIP) as individual sub-links, not 3. **Rule: when the sidebar already provides
sub-navigation into a page's sections (via `?tab=` query params), that page does NOT also
render a `TabsList`** — the sidebar sub-link is the only entry point, `Tabs`/`TabsContent`
stay as the state container but the tab-switcher UI itself is redundant and removed
(Assets, Config, Settings all follow this — see `Sidebar.tsx`'s `NAV_ENTRIES`).

**Sidebar layout must not scroll as a whole.** The app shell wrapper uses `h-svh
overflow-hidden` (not `min-h-svh`) so the sidebar's height is pinned to the viewport —
only the nav item list scrolls (via its own `overflow-y-auto`, with the scrollbar itself
hidden using the `.scrollbar-hide` utility in `globals.css`) and the main content area
scrolls independently. The sidebar's bottom user/sign-out row stays fixed at all times.

**Reports — an "Overall Report" combines all individual reports into one document.**
`/reports/overall` renders every report component in sequence inside a
`ReportEmbedContext.Provider value={true}`, which makes each report render as a plain
`<section>` (smaller heading, no per-report PDF/Excel buttons) instead of its normal
standalone chrome. Only a single top-level "Download PDF" button exists for the combined
page (PDF-only, no Excel — combining 14 tabular sheets into one spreadsheet export isn't
meaningful). Any new report added to `REPORTS` in `reportsRegistry.ts` should also be
added to this page's render list to stay included.

## How to use this with Claude Code

Paste one numbered section at a time (start with **0** and **1**, since every
other screen depends on the shell/tokens being right first). For each
subsequent screen, paste that section's block verbatim — it already has
literal classes and component names, nothing left for Claude Code to
interpret loosely. Verify against the real authenticated route with a
screenshot before moving to the next section, same as before.
