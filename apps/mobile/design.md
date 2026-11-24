# KashMap Mobile — Material Design 3 (M3) Design System

This document is the authoritative design system guide for the KashMap React Native Mobile App (`apps/mobile`). It bridges the proven financial UX, metrics, and workflows of the **KashMap Web App** with the official **Material 3 Design Kit** (`Material 3 Design Kit (Community).fig`).

---

## 1. Principles & Architecture

1. **Information-Dense yet Glanceable:** Financial tracking requires clarity. Net Worth, Cash Flow, Holdings, and Overdue Debtors use M3 high-legibility cards with tonal distinction.
2. **Tonal Elevation over Harsh Drop Shadows:** Surfaces elevate through stepped M3 Surface Containers (`surface-container-low` to `surface-container-highest`) rather than dark heavy drop-shadows.
3. **Adaptive Contrast & Color Safety:** Semantic financial colors (`Success` = Income/Gain, `Destructive` = Expense/Loss) remain strict and independent from theme accents to avoid confusing the user.
4. **Offline & Cross-Platform Reliability:** All visual tokens work seamlessly across React Native (Android, iOS) and Web via NativeWind v4 and dynamic CSS variables.

---

## 2. Color System & Semantic Roles

Material 3 uses dynamic color roles where each role has a paired "On" color guaranteeing WCAG 2.1 AA accessibility.

### 2.1 Core Role Definitions
| M3 Role | Description | Light Mode Example | Dark Mode Example |
|---|---|---|---|
| `primary` | High-emphasis fills, active toggles, FABs | `#1967D2` | `#8AB4F8` |
| `on-primary` | Text/icons displayed on top of `primary` | `#FFFFFF` | `#1A1A1A` |
| `primary-container` | Standout background for highlighted items | `#D3E3FD` | `#1E3A5F` |
| `on-primary-container` | Text/icons displayed on `primary-container` | `#0B3D91` | `#D3E3FD` |
| `secondary` | Secondary buttons, chips, filter tags | `#585F72` | `#C0C6DC` |
| `secondary-container` | Selected chip fills, inactive navigation pills | `#D9DFF6` | `#404659` |
| `tertiary` | Contrasting accents, goal milestones, dividends | `#735573` | `#E0BBDD` |
| `tertiary-container` | Tertiary highlights | `#FBD4F7` | `#593D5A` |
| `error` | Form validation errors, overdue warnings | `#B3261E` | `#F2B8B5` |
| `error-container` | Soft error banner background | `#F9DEDC` | `#8C1D18` |

### 2.2 Tonal Surface Elevation Scale
In M3, elevation is rendered by tinting the neutral surface with increasing opacity of primary tonal values:

| Elevation Level | Token Name | Light Mode | Dark Mode | AMOLED Mode | Usage |
|---|---|---|---|---|---|
| **Level 0** | `surface` | `#FEF7FF` | `#141218` | `#000000` | Background canvas |
| **Level 1** | `surface-container-low` | `#F7F2FA` | `#1D1B20` | `#0A0A0A` | Sub-cards, grouped lists |
| **Level 2** | `surface-container` | `#F3EDF7` | `#211F26` | `#121212` | Standard card surface |
| **Level 3** | `surface-container-high` | `#ECE6F0` | `#2B2930` | `#1A1A1A` | Elevated cards, top app bar |
| **Level 4** | `surface-container-highest` | `#E6E0E9` | `#36343B` | `#242424` | Bottom navigation bar, FAB |
| **Level 5** | Modal dialogs / sheets | `#E4DDE6` | `#3D3A42` | `#2C2C2C` | Bottom sheets, date pickers |

---

## 3. Typography Scale (Inter / Roboto)

M3 typography uses 5 core categories (`Display`, `Headline`, `Title`, `Body`, `Label`) across 3 sizes:

| Typescale Role | Size | Line Height | Weight | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `display-large` | 57px | 64px | Regular (400) | -0.25px | Splash, Hero numbers |
| `display-medium` | 45px | 52px | Regular (400) | 0px | Major Net Worth total |
| `display-small` | 36px | 44px | Regular (400) | 0px | Dashboard balance |
| `headline-large` | 32px | 40px | Bold (700) | 0px | Section headers |
| `headline-medium` | 28px | 36px | SemiBold (600) | 0px | Modal titles |
| `headline-small` | 24px | 32px | SemiBold (600) | 0px | Card headers |
| `title-large` | 22px | 28px | Regular (400) | 0px | Top App Bar titles |
| `title-medium` | 16px | 24px | Medium (500) | 0.15px | List item headers |
| `title-small` | 14px | 20px | Medium (500) | 0.1px | Sub-headers |
| `body-large` | 16px | 24px | Regular (400) | 0.5px | Primary reading text |
| `body-medium` | 14px | 20px | Regular (400) | 0.25px | Secondary card text |
| `body-small` | 12px | 16px | Regular (400) | 0.4px | Timestamps, notes |
| `label-large` | 14px | 20px | Medium (500) | 0.1px | Buttons, Action triggers |
| `label-medium` | 12px | 16px | Medium (500) | 0.5px | Chips, Filter tags |
| `label-small` | 11px | 16px | Medium (500) | 0.5px | Badges, small counters |

> **Financial Numerals:** Always apply `tabular-nums` (`fontVariant: ["tabular-nums"]`) to all financial currencies, balances, and counts so digits remain vertically aligned in tables and lists.

---

## 4. Shape & Corner Radii Scale

Material 3 defines geometric shapes as a primary brand element:

| Token | Radius | CSS / Tailwind Class | Application |
|---|---|---|---|
| `none` | 0px | `rounded-none` | Full bleed banners, dividers |
| `extra-small` | 4px | `rounded-m3-xs` | Progress bar tracks, snackbars |
| `small` | 8px | `rounded-m3-sm` | Filter chips, small badges |
| `medium` | 12px | `rounded-m3-md` | Buttons, input text fields |
| `large` | 16px | `rounded-m3-lg` | Standard cards, FABs |
| `extra-large` | 28px | `rounded-m3-xl` | Dialogs, Modal bottom sheets (top) |
| `full` | 9999px | `rounded-m3-full` | Navigation pills, avatars, pills |

---

## 5. Component Specifications

### 5.1 Buttons
- **Filled Button:** `bg-primary`, `text-on-primary`, height 40px, padding horizontal 24px, pill shape (`rounded-m3-full`).
- **Filled Tonal Button:** `bg-primary-container`, `text-on-primary-container`, height 40px, padding horizontal 24px, pill shape.
- **Outlined Button:** `border border-outline-variant`, `text-primary`, height 40px, padding horizontal 24px.
- **Floating Action Button (FAB):** 56x56px, `bg-primary-container`, `rounded-m3-lg` (16px), 6dp elevation.
- **Extended FAB:** Height 56px, `rounded-m3-lg`, icon + `label-large` text.

### 5.2 Cards
- **Elevated Card:** `bg-surface-container-low`, 1px border `border-outline-variant`, `rounded-m3-lg` (16px), padding 16px.
- **Filled Card:** `bg-surface-container-highest`, no border, `rounded-m3-lg`, padding 16px.
- **Outlined Card:** `bg-surface`, `border border-outline-variant`, `rounded-m3-lg`, padding 16px.

### 5.3 Text Fields
- **Filled Text Field:** `bg-surface-container-highest`, bottom 1px indicator (transforms to 2px primary on focus), height 56px, floating label.
- **Outlined Text Field:** `border border-outline-variant` (transforms to 2px primary on focus), 12px radius, height 56px.

### 5.4 Navigation Bar (Bottom Tabs)
- Height: 80px.
- Background: `surface-container` (`#F3EDF7` in light, `#211F26` in dark).
- Active Pill: 64px width, 32px height, `rounded-m3-full`, background `secondary-container`.
- Icon + Label layout with smooth transition on tab change.

### 5.5 Modal Bottom Sheet
- Top Corner Radius: 28px (`rounded-t-m3-xl`).
- Background: `surface-container-low` (`#F7F2FA` in light, `#1D1B20` in dark).
- Drag Handle: 32x4px pill, centered, color `outline-variant`.

---

## 6. Motion & Interaction

- **Emphasized Easing:** `cubic-bezier(0.2, 0.0, 0, 1.0)` — used for opening sheets, expanding cards, and page transitions.
- **Standard Decelerate:** `cubic-bezier(0.0, 0.0, 0.2, 1)` — used for elements entering the screen.
- **Standard Accelerate:** `cubic-bezier(0.3, 0.0, 1, 1)` — used for elements exiting the screen.
- **State Layers:**
  - Pressed State: `0.96` scale transform + 12% opacity tint overlay.
  - Hover / Focus State: 8% opacity tint overlay.
