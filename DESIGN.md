# Design: KashMap

The locked system. Every Hallmark run on this repo reads this file first and every page
shares it. This supersedes `UI_SPEC.md` as the authoritative design reference — `UI_SPEC.md`
is being rewritten section by section as each phase of the redesign lands (see
`vibe-starter/.agents/` for the phase plan); until a section is rewritten, this file wins
where the two disagree. Change this file on purpose; it is the rule, not a suggestion.

## System

- Genre: modern-minimal (fintech/SaaS), custom direction — no dealt theme. The brand (colors,
  logo, type) is the project's own, carried forward as found, never re-derived.
- Shape: differs by page kind, system stays shared. Marketing pages (`/`, `/features`,
  `/pricing`, …) run an editorial-leaning shape; `(auth)` pages are a Stage (split form +
  imagery); `(app)` screens are recomposed within their existing shell — same tokens, no hero.
- Posture: calm and exact, built for daily financial review, not a sales floor.
- Signature material: **liquid glass**, used deliberately and sparingly — never the default
  surface. Reserved for things that genuinely float above other content: a sticky header over
  scrolled content, a popover/dropdown/dialog, an imagery-backed panel (the auth carousel).
  Flat cards everywhere else stay flat (`UI_SPEC.md`'s "no drop shadows" rule holds).

## Tokens

`apps/web/src/app/globals.css` is the source of truth (not a separate `tokens.css` — this is
an existing, already-tokenized Tailwind v4 / shadcn codebase, so the system extends it in
place rather than forking a parallel file). The roles:

```css
:root {
  /* brand primitives — single source of truth, semantic tokens below reference these */
  --color-black: #000000;  --color-white: #FFFFFF;
  --color-brand-green: #15803D;       /* light-mode primary */
  --color-brand-green-dark: #22C55E;  /* dark-mode primary */
  --color-brand-purple: #8E24AA;      /* light-mode accent2 */
  --color-brand-purple-dark: #9C27B0; /* dark-mode accent2 */

  --background: …; --foreground: …; --card: …; --primary: var(--color-brand-green); …

  /* liquid glass — the lit top edge is what makes it read as glass, never drop it */
  --glass-edge: inset 0 1px 0 0 color-mix(in oklch, var(--color-white) 45%, transparent);
  --glass-border: color-mix(in oklch, var(--color-black) 8%, transparent);
  --shadow-glass: var(--glass-edge), 0 24px 48px -28px color-mix(in oklch, var(--color-black) 35%, transparent);

  --font-sans: var(--font-inter);        /* body, UI */
  --font-display: var(--font-newsreader); /* headlines only — landing, auth titles, hero figures */
  --font-mono: var(--font-geist-mono);    /* every numeric amount, no exceptions */

  --radius-2xl: 1rem;  /* fixed card/button/input radius, not a proportional scale */
  --shadow-sm/md/lg: none; /* flat by default — glass is the one deliberate exception */
}
```

Utility classes: `.glass-surface` (sticky headers, popovers) and `.glass-surface-strong`
(dialogs/modals) in `globals.css`, both built from the tokens above. Never nest one inside
another; never ship blur without `--glass-edge`.

## Controls

- Primary: solid fill (`--primary`) · `rounded-xl` · flat, no shadow, `brightness-95` on hover.
- Secondary/ghost: outline or text, same radius and height as primary.
- Labels, table heads, captions: sentence case, body face, never tracked uppercase (Hallmark
  floor rule 9 — `UI_SPEC.md`'s old `uppercase tracking-wide` heading pattern is retired).

## Motion

- Character: calm, brisk on interaction feedback (hover/press), still by default. One reveal
  at most per screen. `prefers-reduced-motion: reduce` / `motion-reduce:` always has a static
  fallback — never animate `width`/`height`/`top`/`left`, transforms and opacity only.

## Exports

`apps/web/src/app/globals.css` in this project. No separate design-token package today;
`packages/shared` stays logic/schema-only per `CLAUDE.md`.
