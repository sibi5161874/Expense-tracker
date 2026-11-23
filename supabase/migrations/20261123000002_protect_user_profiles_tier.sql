-- Protect subscription tier columns on user_profiles from client-side tampering.
-- Non-service_role callers (authenticated / anon) cannot modify tier, trial timestamps, or lifetime purchase flags.

create or replace function public.protect_user_profile_tier_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    old.tier is distinct from new.tier or
    old.trial_started_at is distinct from new.trial_started_at or
    old.trial_ends_at is distinct from new.trial_ends_at or
    old.lifetime_purchased_at is distinct from new.lifetime_purchased_at
  ) then
    if current_user not in ('service_role', 'postgres', 'supabase_admin') and
       coalesce(auth.role(), '') != 'service_role' then
      raise exception 'Permission denied: subscription tier columns can only be modified by the server-side billing service.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_user_profile_tier on public.user_profiles;
create trigger trg_protect_user_profile_tier
  before update on public.user_profiles
  for each row execute function public.protect_user_profile_tier_columns();
