# prompts/code-review.md — Review Against RULES.md

Before considering anything complete, also run through the
`review-before-merge` skill (`.claude/skills/review-before-merge`) —
it's this repo's actual pre-merge checklist (verification, RLS,
entitlement gating, secrets).

For a code-quality pass specifically, check the diff against:
1. §1/§10 — RLS present and tested for any new/changed table.
2. §2 — `service_role` only where the rules explicitly allow it.
3. §5 — entitlement checks server-side, reading `tierConfig.ts`, never
   a hardcoded limit in a component.
4. §6 — error logging shape and rate limiting on any new public endpoint.
5. §9 — import confidence tiers respected if touching import code.
6. §12/§13 — component size, derived values computed not stored.
7. §19 — webhook retry/idempotency if touching payments.

Cite the section number in the review, not a general style opinion.
