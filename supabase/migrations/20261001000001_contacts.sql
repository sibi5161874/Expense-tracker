-- Saved cashbook contacts — a name + a stable avatar seed for the Blobatar avatar package
-- (apps/web/src/components/CashbookForm.tsx). `cashbook.counterparty` stays a plain string
-- column; picking a contact just fills that field with the contact's name, so every existing
-- cashbook report/query (already grouping by `counterparty`) keeps working unchanged — this
-- table is purely a convenience list for the "add contact" dropdown, not a FK-linked entity.

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  avatar_seed text not null,
  created_at timestamptz not null default now()
);

create index contacts_user_id_idx on public.contacts (user_id);

alter table public.contacts enable row level security;

create policy "contacts_select_own" on public.contacts
  for select using (auth.uid() = user_id);

create policy "contacts_insert_own" on public.contacts
  for insert with check (auth.uid() = user_id);

create policy "contacts_update_own" on public.contacts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "contacts_delete_own" on public.contacts
  for delete using (auth.uid() = user_id);
