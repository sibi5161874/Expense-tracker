-- Closes a real duplicate-order risk in apps/web/src/app/api/payments/create-order:
-- the route used to SELECT for an existing pending order, then call Razorpay, then INSERT
-- the result — two requests (a genuine double-click, or a client retry after its own
-- timeout while the first attempt is still in flight) can both pass the SELECT before either
-- INSERTs, both call Razorpay, and mint two real paid orders with only one ever recorded
-- locally. This function makes the reservation atomic and moves it *before* the Razorpay
-- call: the INSERT itself — guarded by the existing payment_events_pending_order_idx partial
-- unique index — is the only thing that decides which request is allowed to call Razorpay.
--
-- Runs with the caller's own privileges (no `security definer`), so RLS still applies exactly
-- as it does for a plain insert from the route today — this isn't a new trust boundary.
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
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.payment_events;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Wins the reservation iff no 'created' row already exists for this (user, purpose) —
  -- the same partial unique index that already existed, just checked before the external
  -- call instead of after it.
  insert into public.payment_events (user_id, purpose, amount_paise, razorpay_order_id, status)
  values (v_user_id, p_purpose, p_amount_paise, p_placeholder_order_id, 'created')
  on conflict (user_id, purpose) where status = 'created' do nothing
  returning * into v_row;

  if found then
    return query select v_row.id, v_row.razorpay_order_id, v_row.amount_paise, true;
    return;
  end if;

  -- Someone else (an earlier call, or a concurrent one that won the race above) already
  -- holds the reservation — hand back whatever it currently has. The caller distinguishes
  -- "already a real order" from "still mid-flight" by checking the placeholder prefix.
  select * into v_row from public.payment_events
  where user_id = v_user_id and purpose = p_purpose and status = 'created'
  limit 1;

  return query select v_row.id, v_row.razorpay_order_id, v_row.amount_paise, false;
end;
$$;

grant execute on function public.reserve_payment_order(public.payment_purpose, integer, text) to authenticated;
