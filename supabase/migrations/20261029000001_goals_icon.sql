-- Dedicated icon column for goals, replacing the leading-emoji-in-goal_name convention
-- (apps/web previously prepended a literal emoji character to goal_name and stripped it
-- back out with a regex at render time). Nullable: existing goals keep their emoji-prefixed
-- goal_name untouched (the web app's extractEmoji() fallback still parses those), while new
-- and re-saved goals store a lucide icon name here instead.

alter table public.goals add column icon text;
