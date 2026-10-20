# prompts/feature-add.md — Add a Feature

Use the `add-feature` skill (`.claude/skills/add-feature`) — it already
encodes the standard workflow for this repo: migration → Zod schema in
`packages/shared/src/schemas` → query function → web UI → mobile UI →
correct entitlement gating.

Before invoking it, confirm from `docs/ARCHITECTURE.md` / `tierConfig.ts`:
- Is this feature free or Pro? Check `FEATURE_GATES`, don't guess.
- Does it need a new table? If so, it needs RLS (`user_id = auth.uid()`)
  and a migration under `supabase/migrations/` — see `RULES.md §1`.
- Does web and mobile both need it this round, or is a web-first/mobile-later split fine?

After: update `vibe-starter/.agents/_session.md` with what shipped.
