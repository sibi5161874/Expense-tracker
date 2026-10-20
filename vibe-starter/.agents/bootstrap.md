# .agents/bootstrap.md — Agent Boot Protocol for KashMap

## Phase A — Read the manifest

Read `vibe-starter/.agents/manifest.json`. Note `readingOrder`,
`skillsAlreadyDefined`, `verification`, and `constraints`.

## Phase B — Read every file in `readingOrder`, in order

Includes the real root `CLAUDE.md` and `RULES.md` (§1–§19) — don't
skip them because this manifest already summarizes a few points; the
summary is a pointer, not a substitute.

## Phase C — Read where things left off

Read `vibe-starter/.agents/_session.md`. This tells you the last
work done, the current repo state, and what's next — the user should
not have to repeat this in chat.

## Phase D — Prove understanding (short, no need to stop and wait)

Unlike a from-scratch build, this is a live app — don't gate on
approval before every session. Just state, in a few lines:
1. What you're being asked to do this session.
2. Which rule sections (RULES.md) are relevant to it.
3. Whether it's covered by an existing skill in `.claude/skills/` —
   use that skill's workflow if so, rather than inventing one.
4. Anything in `_session.md` that changes your plan.

## Phase E — Work, then update `_session.md`

Before ending the session, update `vibe-starter/.agents/_session.md`:
what you did, what you verified, what's left, any new open question.
This is the only file that needs to stay current — everything else
describes the app, not a moment in time.

## Resume protocol

A new session just repeats Phases A–C — `_session.md` is small and
fast to read, so there's no separate "crash resume" path.

## Hard rules

- Never skip reading the real `RULES.md` because the manifest's
  `constraints` field looks sufficient — that field is a quick-reference,
  not the full rule text.
- Never mark a feature done without its `verification` checks in the manifest.
- Never assume mobile lacks a feature without checking `MOBILE_ROADMAP.md` first.

## Anti-patterns

- Re-deriving a workflow that `.claude/skills/` already defines.
- Leaving `_session.md` stale after a session that changed real state.
- Treating this as a from-scratch build and proposing a 12-phase plan — it isn't one.
