-- user_profiles (DATA_MODEL.md §10): one row per user, powers the onboarding
-- wizard and the Financial Essentials Check. Age is derived from date_of_birth
-- in packages/shared/logic, not stored, so it never goes stale.
--
-- insurance_policies (DATA_MODEL.md §9): manual entry, one row per policy.

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  date_of_birth date,
  monthly_income numeric(12,2),
  monthly_expense numeric(12,2),
  number_of_dependents integer not null default 0 check (number_of_dependents >= 0),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;

create policy "user_profiles_select_own" on public.user_profiles
  for select using (auth.uid() = user_id);
create policy "user_profiles_insert_own" on public.user_profiles
  for insert with check (auth.uid() = user_id);
create policy "user_profiles_update_own" on public.user_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_profiles_delete_own" on public.user_profiles
  for delete using (auth.uid() = user_id);

create type public.insurance_policy_type as enum ('Term', 'Health', 'Motor', 'Other');

create table public.insurance_policies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_type public.insurance_policy_type not null,
  insurer text not null,
  policy_number text not null,
  coverage_amount numeric(12,2) not null check (coverage_amount >= 0),
  premium_amount numeric(12,2) not null check (premium_amount >= 0),
  premium_due_date date not null,
  nominee text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.insurance_policies
  for each row execute function public.set_updated_at();

alter table public.insurance_policies enable row level security;

create policy "insurance_policies_select_own" on public.insurance_policies
  for select using (auth.uid() = user_id);
create policy "insurance_policies_insert_own" on public.insurance_policies
  for insert with check (auth.uid() = user_id);
create policy "insurance_policies_update_own" on public.insurance_policies
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "insurance_policies_delete_own" on public.insurance_policies
  for delete using (auth.uid() = user_id);
