-- Revoke direct client write access (insert/update) on payment_events.
-- Prevents clients from forging captured payment logs or altering order state via PostgREST.

drop policy if exists "payment_events_insert_own" on public.payment_events;
drop policy if exists "payment_events_update_own" on public.payment_events;

-- Users may only read their own payment history
drop policy if exists "payment_events_select_own" on public.payment_events;
create policy "payment_events_select_own" on public.payment_events
  for select using (auth.uid() = user_id);

-- Upgrade reserve_payment_order to security definer so authenticated callers can safely
-- create a pending order reservation without requiring raw table-level INSERT permissions.
create or replace function public.reserve_payment_order(
  p_purpose public.payment_purpose,
  p_amount_paise integer,
  p_placeholder_order_id text
)
returns table (
  id uuid,
  razorpay_order_id text,
  amount_paise integer,
  reserved_by_me boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.payment_events;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.payment_events (user_id, purpose, amount_paise, razorpay_order_id, status)
  values (v_user_id, p_purpose, p_amount_paise, p_placeholder_order_id, 'created')
  on conflict (user_id, purpose) where status = 'created' do nothing
  returning * into v_row;

  if found then
    return query select v_row.id, v_row.razorpay_order_id, v_row.amount_paise, true;
    return;
  end if;

  return query
  select pe.id, pe.razorpay_order_id, pe.amount_paise, false
  from public.payment_events pe
  where pe.user_id = v_user_id
    and pe.purpose = p_purpose
    and pe.status = 'created'
  limit 1;
end;
$$;
