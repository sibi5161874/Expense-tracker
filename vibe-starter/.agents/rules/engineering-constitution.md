# Engineering Constitution (Universal)

## Analyse before writing

Read the existing pattern for the thing you're about to add before
writing new code. Three similar lines beat a premature abstraction.

## File/function limits

Files ≤ 250 lines. Functions ≤ 50 lines (`RULES.md §3`). Split by
responsibility, not by line count alone — a split that doesn't reduce
coupling isn't done yet.

## No dead code

Delete code you're certain is unused rather than commenting it out or
flagging it for "later." Git history is the backup.

## Naming

Name things for what they are, not for the task that created them. A
function added for "the CSV import fix" is named for what it does, not
for the fix.

## Testing

Write the test that would have caught the bug you just fixed, before
fixing it. Unit test business logic; integration test the seam between
layers; E2E test the user-visible flow.

## Measurement before optimization

Don't optimize without a measurement showing it matters. Correctness and
clarity first; profile before trading either away for speed.
