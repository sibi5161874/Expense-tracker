# vibe-starter/ — Vibe-Coding Setup for KashMap (Expense-tracker)

This folder is the one place a new AI coding session needs to read to
get fully oriented on this repo — what it is, how it's built, what the
rules are, and what's already shipped — without you re-explaining any
of it in chat.

It does **not** change anything in `apps/web`, `apps/mobile`, or
`packages/shared`. It's a read-first layer on top of the app. The real
rules and UI spec already live at the repo root (`../RULES.md`,
`../UI_SPEC.md`, `../CLAUDE.md`, `../MOBILE_ROADMAP.md`) — this folder
doesn't duplicate them, it tells an agent to read them, in order, plus
three docs that fill in context those files don't cover: the shape of
the data model, the architecture end-to-end, and the current shipped
status.

## Start every new session with

```
Read vibe-starter/.agents/manifest.json and follow vibe-starter/.agents/bootstrap.md.
```

That one line replaces explaining the stack, the rules, or where things
stand. The agent reads `_session.md` for "where I left off," reads the
manifest's `readingOrder`, and proves it understood before touching code.

## What's in here

| Path                    | Purpose                                                                   |
| :---------------------- | :------------------------------------------------------------------------ |
| `.agents/manifest.json` | Machine-readable: stack, reading order, constraints                       |
| `.agents/bootstrap.md`  | The boot protocol an agent follows                                        |
| `.agents/_session.md`   | Live "where I left off" — update this at the end of a session             |
| `.agents/rules/*.md`    | Engineering + autonomy rules (generic, stack-agnostic)                    |
| `docs/ARCHITECTURE.md`  | How the app is actually built, end to end                                 |
| `docs/DATA_MODEL.md`    | Real entities, real RLS model (per-user, not multi-tenant)                |
| `docs/STATUS.md`        | What's shipped, what's mid-flight, what's next                            |
| `docs/GLOSSARY.md`      | App-specific terms (XIRR, incognito mode, solo mode, essentials score, …) |
| `prompts/*.md`          | Short task prompts; point to `.claude/skills/*` where one already exists  |

## Keeping it current

When you finish a work session, update `.agents/_session.md` with what
you did and what's next. That's the only file that needs regular
upkeep — everything else only changes when the stack or rules actually change.

<!--

“Read vibe-starter/.agents/manifest.json and follow vibe-starter/.agents/bootstrap.md.”

-->
