-- Base table-level privileges for anon/authenticated roles.
--
-- RLS policies only restrict which ROWS a role can see once it already has
-- permission to touch the table at all. Postgres denies access by default to
-- any role that isn't the table owner, so without these grants every request
-- fails with "permission denied for schema public" (42501) before RLS policies
-- are even evaluated. `anon` stays harmless here since every RLS policy is
-- scoped to auth.uid() = user_id, and auth.uid() is null for anon requests.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to anon, authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
