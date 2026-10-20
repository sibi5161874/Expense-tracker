# Autonomous Execution — When to Run vs When to Ask

## Run without asking (routine)

- Writing code that follows an existing pattern in the codebase.
- Adding a migration that follows the conventions in `RULES.md §1`.
- Writing tests for code you just wrote.
- Fixing a typecheck/lint error your own change introduced.
- Updating `CHANGELOG.md` / `DATA_MODEL.md` for a change you just made.

## Ask first

- Any change to a security setting, RLS policy shape, or auth flow.
- Any change that touches `shared/config/*` in a way that affects every tenant.
- Any destructive or hard-to-reverse action (dropping a column/table, force-push, deleting data).
- Any architectural decision `docs/STACK.md` leaves open.
- Anything `RULES.md` doesn't clearly cover — ambiguity defaults to asking, not guessing.

## Ambiguity

If a request could reasonably mean two different things, ask which one —
don't silently pick the more convenient interpretation.

## Destructive actions

Never run a destructive database or git operation without the human
confirming the specific action, even if a prior similar action was approved.
