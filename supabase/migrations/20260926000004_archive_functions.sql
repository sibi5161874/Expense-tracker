-- Migration 4: Archival engine with audit logging and security definer isolation.

-- Audit log for automated and manual archival runs
create table if not exists public.archive_runs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  rows_moved integer not null,
  ran_at timestamptz default now(),
  duration_ms integer
);

-- Service-role only (no public RLS policies)
alter table public.archive_runs enable row level security;
comment on table public.archive_runs is 'Audit log of data archival runs. Service-role only.';

-- Function to safely move old records into archive table
create or replace function public.archive_old_records(
  p_table_name text,
  p_cutoff_date date default (current_date - interval '2 years')::date
)
returns integer
language plpgsql
security definer
as $$
declare
  v_start_time timestamptz := clock_timestamp();
  v_duration_ms integer;
  v_rows_moved integer := 0;
  v_date_col text;
begin
  -- Enforce strict allowlist to prevent arbitrary table deletion / SQL injection
  if p_table_name not in ('transactions', 'investment_log', 'cashbook', 'net_worth_snapshots') then
    raise exception 'Table % is not in the archival allowlist', p_table_name;
  end if;

  if p_table_name = 'net_worth_snapshots' then
    v_date_col := 'snapshot_date';
  else
    v_date_col := 'date';
  end if;

  execute format(
    'with moved as (
       delete from public.%I
       where %I < $1
       returning *
     )
     insert into public.%I
     select * from moved',
    p_table_name,
    v_date_col,
    p_table_name || '_archive'
  ) using p_cutoff_date;

  get diagnostics v_rows_moved = row_count;

  v_duration_ms := (extract(epoch from (clock_timestamp() - v_start_time)) * 1000)::integer;

  insert into public.archive_runs (table_name, rows_moved, duration_ms)
  values (p_table_name, v_rows_moved, v_duration_ms);

  return v_rows_moved;
end;
$$;

comment on function public.archive_old_records is 'Atomically moves records older than cutoff date into archive tables and records an audit run.';

-- Diagnostic function for Admin Health Dashboard
create or replace function public.get_database_stats()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_db_size bigint;
  v_db_limit bigint := 524288000; -- 500 MB
  v_pct numeric;
  v_tables jsonb;
  v_runs jsonb;
  v_compressions jsonb;
begin
  select pg_database_size(current_database()) into v_db_size;
  v_pct := round((v_db_size::numeric / v_db_limit::numeric) * 100, 2);

  select coalesce(jsonb_agg(jsonb_build_object(
    'table', relname,
    'size_bytes', pg_total_relation_size(relid),
    'rows', coalesce(n_live_tup, 0),
    'dead_tuples', coalesce(n_dead_tup, 0)
  ) order by pg_total_relation_size(relid) desc), '[]'::jsonb)
  into v_tables
  from pg_stat_user_tables
  where schemaname = 'public';

  select coalesce(jsonb_agg(jsonb_build_object(
    'table', table_name,
    'rows_moved', rows_moved,
    'ran_at', ran_at,
    'duration_ms', duration_ms
  ) order by ran_at desc), '[]'::jsonb)
  into v_runs
  from (
    select table_name, rows_moved, ran_at, duration_ms
    from public.archive_runs
    order by ran_at desc
    limit 10
  ) r;

  select coalesce(jsonb_agg(jsonb_build_object(
    'table', c.relname,
    'column', a.attname,
    'compression', case when a.attcompression = 'l' then 'lz4' else 'pglz' end
  )), '[]'::jsonb)
  into v_compressions
  from pg_attribute a
  join pg_class c on a.attrelid = c.oid
  join pg_namespace n on c.relnamespace = n.oid
  where n.nspname = 'public'
    and a.attname in ('notes', 'goal_name')
    and c.relname in ('transactions', 'investment_log', 'cashbook', 'goals');

  return jsonb_build_object(
    'database_size_bytes', v_db_size,
    'database_limit_bytes', v_db_limit,
    'percentage_used', v_pct,
    'table_breakdown', v_tables,
    'archive_runs', v_runs,
    'compression_status', v_compressions
  );
end;
$$;

comment on function public.get_database_stats is 'Returns aggregated database storage health and compression stats for admin monitoring.';
