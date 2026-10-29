# UI Spec — Exact Values, Per Screen

**Superseded by a Hallmark redesign pass (2026-10) — read `DESIGN.md` at the repo root
first.** That file is now the authoritative system (brand tokens, the liquid-glass
material, motion rules, label casing). This file still documents per-screen *composition*
(what pattern each route uses — editorial list vs. command-bar-table vs. bento grid) and
remains useful for that, but section 0 below, and every literal class string anywhere in
this file that still says `uppercase tracking-wide`, is stale — fixed in the codebase, not
yet fixed in every line of this doc. Where this file and `DESIGN.md` disagree, `DESIGN.md`
wins. No abstractions below — every value is literal. Hand a screen's section directly to
Claude Code as-is, but check it against `DESIGN.md`'s rules first.

---

## 0. Global Tokens (actual values — read `apps/web/src/app/globals.css` directly; this is a snapshot)

```css
:root {
  /* Brand primitives — single source of truth, semantic tokens below reference these */
  --color-black: #000000;  --color-white: #FFFFFF;
  --color-brand-green: #15803D;       /* light-mode primary */
  --color-brand-green-dark: #22C55E;  /* dark-mode primary */
  --color-brand-purple: #8E24AA;      /* light-mode accent2 */
  --color-brand-purple-dark: #9C27B0; /* dark-mode accent2 */
  --color-bmc: #FFDD00;               /* third-party brand mark (Buy Me a Coffee), not ours */

  /* "Warm Paper White" light mode */
  --background: #F8F9FA;   --foreground: #1A1A1A;
  --card: var(--color-white);
  --primary: var(--color-brand-green);  --primary-foreground: var(--color-white);
  --accent2: var(--color-brand-purple); /* segmented controls, active-tab highlights */

  --success: oklch(0.6 0.155 149);  --warning: oklch(0.75 0.155 78);
  --destructive: #D32F2F;  --info: #1976D2;
  /* every semantic color also has a `-foreground` and a `-subtle` pairing — see globals.css */

  --chart-1: var(--color-brand-green);  --chart-2: var(--color-brand-purple);
  --chart-3: oklch(0.55 0.145 340);  --chart-4: oklch(0.52 0.14 260);  --chart-5: oklch(0.55 0.015 75);

  /* Liquid glass — reserved for things that float above other content (a sticky header
     over scrolled content, a popover/dialog, an imagery-backed panel). Never the default
     surface. The lit top edge is what reads as glass, not a tinted box — never drop it. */
  --glass-edge: inset 0 1px 0 0 color-mix(in oklch, var(--color-white) 45%, transparent);
  --shadow-glass: var(--glass-edge), 0 24px 48px -28px color-mix(in oklch, var(--color-black) 35%, transparent);

  --radius-2xl: 1rem;  /* fixed card/button/input radius, not a proportional scale */
  --shadow-xs/sm/md/lg: none;  /* flat by default — glass is the one deliberate exception */
}

.dark {
  /* "AMOLED True-Black" — a named, intentional choice (OLED power/contrast), not a reflex default */
  --background: var(--color-black);  --foreground: var(--color-white);
  --card: #1A1A1A;
  --primary: var(--color-brand-green-dark);  --primary-foreground: #052E16;
  --accent2: var(--color-brand-purple-dark);
  --chart-1: var(--color-brand-green-dark);  --chart-2: var(--color-brand-purple-dark);
  /* same semantic hues as light, lightness raised for dark-bg contrast; --glass-edge/--shadow-glass
     get mode-correct values too — see globals.css, they are not the same numbers as light mode */
}
```

**Typography:**
- Display (hero numbers, landing/auth headlines): `font-family: Newsreader` via `next/font/google`
  (**not Fraunces** — an earlier version of this spec specified Fraunces; the app was actually
  built and shipped on Newsreader, wired in `apps/web/src/app/layout.tsx` as `--font-newsreader`
  and exposed as `font-serif`/`font-display`). Used sparingly: page headlines, auth card titles,
  one hero figure per screen — never a body font substitute.
- Body: Inter (`font-sans`, the default).
- Numeric (every amount, no exceptions): `font-family: Geist Mono` (`font-mono`), `font-variant-numeric: tabular-nums`.
  Mono is for code and figures only — never for a prose label or a short badge word just because
  it looks techy (e.g. a currency-code badge like "USD" needs no `font-mono`: it's already
  correctly cased as plain text).

**Type scale (exact Tailwind classes to use, don't invent others):**
| Use | Class |
|---|---|
| Hero number | `text-6xl md:text-8xl font-display font-medium tracking-tight leading-none` |
| Page title | `text-2xl font-semibold tracking-tight` |
| Section heading | `text-sm font-semibold text-muted-foreground` |
| Body text | `text-sm` |
| Caption / label | `text-xs font-medium text-muted-foreground` |
| Table numeric cell | `font-mono tabular-nums text-sm text-right` |

**Never `uppercase`/`tracking-wide` on a section heading, caption, table head, badge or nav
label — sentence case, untracked, a step smaller than body text, in the body face.** Every
occurrence of `uppercase tracking-wide` later in this file (sections 2, 4, 5, 8 below) is the
*old*, now-wrong value; the live code uses the row above instead. This was fixed site-wide in
the 2026-10 pass because tracked capitals are a generic-template tell, not a deliberate choice
this app made.

**Color literals are never hardcoded Tailwind palette classes** (`text-emerald-600`,
`bg-amber-500/15`, `dark:text-emerald-400`, etc.) in page/component code — always the semantic
tokens above (`text-success`, `bg-warning-subtle`, `text-destructive`, …) so a single token
edit re-themes every screen. This was also a site-wide fix in the 2026-10 pass; treat any
hardcoded Tailwind color class you see in old code as a bug, not a pattern to copy.

**Motion:** never `transition-all` — name the actual properties that change
(`transition-[background-color,transform]`, `transition-colors`, …), since `transition-all`
silently animates `width`/`height`/`top`/`left` if a later edit ever touches them, which is
banned outright (use a fixed-width track with `transform: scaleX()` for a progress bar or
pill-width indicator instead of animating `width`). Every transform/animation needs a
`motion-reduce:`/`motion-safe:` fallback.

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
Hero: no Card wrapper. Label: text-xs font-medium text-muted-foreground
  mb-1. Number: text-6xl md:text-8xl font-display, colored by sign
  (text-success or text-destructive if negative, text-foreground if net-worth positive-neutral).
Sub-stats below hero: flex divide-x divide-border, each item px-6 first:pl-0,
  label text-xs text-muted-foreground, value font-mono tabular-nums text-lg mt-1.

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
  (Badge variant="outline", text-xs sentence case, e.g. "Buy"/"Sip"/"Dividend")
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
      TableHead className="text-xs text-muted-foreground font-medium"
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
  Section heading: text-sm font-semibold text-muted-foreground,
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

**Color tokens — resolved.** This amendment used to flag that section 0's brass/amber
`--primary` and warm-ivory backgrounds were stale. Section 0 above has since been rewritten
with the real values (Warm Paper White / AMOLED true-black, brand green `--primary`, the
liquid-glass tokens from the 2026-10 Hallmark pass); `globals.css` is still the literal
source of truth if the two ever drift again.

**Reports — an "Overall Report" combines all individual reports into one document.**
`/reports/overall` renders every report component in sequence inside a
`ReportEmbedContext.Provider value={true}`, which makes each report render as a plain
`<section>` (smaller heading, no per-report PDF/Excel buttons) instead of its normal
standalone chrome. Only a single top-level "Download PDF" button exists for the combined
page (PDF-only, no Excel — combining 14 tabular sheets into one spreadsheet export isn't
meaningful). Any new report added to `REPORTS` in `reportsRegistry.ts` should also be
added to this page's render list to stay included.

## 12. The 2026-10 Hallmark redesign — what changed, repo-wide

A full design pass (landing/marketing pages, the auth flow, and all `(app)` screens) fixed
the same handful of issues everywhere rather than screen-by-screen improvisation. Treat
these as standing rules, not one-off fixes, for any new screen:

- **No tracked uppercase** on section headings, captions, table heads, badges, nav labels.
  Sentence case, untracked, a step smaller, in the body face (section 0 above).
- **Semantic tokens, not hardcoded palette classes.** `text-success`/`text-warning`/
  `text-destructive`/`text-info` and their `-subtle`/`-foreground` pairs, never
  `text-emerald-600 dark:text-emerald-400` or similar.
- **Liquid glass, used sparingly.** `.glass-surface` / `.glass-surface-strong` utilities in
  `globals.css` (lit top edge + blur + a real shadow) are the only sanctioned "floating"
  surface — the sticky nav, dialogs/popovers, the `AiChatWidget` panel. Never the default
  card surface, never stacked, never without the lit edge.
- **Never animate `width`/`height`/`top`/`left`.** A sidebar collapse, a progress bar fill,
  an accordion open/close: use `transform: scaleX()`/`scaleY()` for a fill, or the CSS-grid
  `grid-template-rows: 0fr → 1fr` trick for a height-based reveal, never a literal
  width/height transition.
- **`transition-all` is banned** — name the properties. Every transform/animation needs a
  `motion-reduce:` or `motion-safe:` guard.
- **No emoji as an icon.** One icon library (Lucide, already in use everywhere) or a real
  SVG. The one deliberate exception: `GoalEmojiPicker` lets a user pick an emoji as their
  own goal's badge — that's the feature's actual content, not a decorative icon standing in
  for a proper one, so it's exempt.
- **No invented numbers.** A stat, a user count, an AUM figure: either it's real (reads from
  the app's own data/config) or it doesn't go on the page. Two fabricated marketing stats
  (a fake investor count, a fake AUM figure) were found and removed during this pass.

See `DESIGN.md` for the full token/system reference these rules draw from.

## How to use this with Claude Code

Paste one numbered section at a time (start with **0** and **1**, since every
other screen depends on the shell/tokens being right first). For each
subsequent screen, paste that section's block verbatim — it already has
literal classes and component names, nothing left for Claude Code to
interpret loosely. Verify against the real authenticated route with a
screenshot before moving to the next section, same as before.
