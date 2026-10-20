# prompts/bug-fix.md — Fix a Bug

If it's an import/statement-parsing bug, use the `fix-import-bug` skill
(`.claude/skills/fix-import-bug`) directly — it already covers the
column-heuristics / confidence-tier / self-reconciliation failure modes
specific to this codebase.

For anything else:
1. Reproduce with a failing test first (`RULES.md §18`).
2. Check whether the same pattern is wrong elsewhere (e.g. a missing
   `user_id` filter copy-pasted into more than one query function).
3. Fix the minimum needed; re-run `pnpm --filter web verify:rls` if the
   fix touched RLS or a query filter.
4. Note the fix in `vibe-starter/.agents/_session.md`.
