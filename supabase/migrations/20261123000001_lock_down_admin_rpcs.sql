-- Lock down administrative RPC functions from client execution.
-- Prevents unauthorized database archival / wiping or storage metrics inspection.

revoke execute on function public.archive_old_records(text, date) from public, anon, authenticated;
grant execute on function public.archive_old_records(text, date) to service_role;

revoke execute on function public.get_database_stats() from public, anon, authenticated;
grant execute on function public.get_database_stats() to service_role;
