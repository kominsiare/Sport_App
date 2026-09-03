-- Pllayz Module 6: Razorpay Test Mode orders, webhook-confirmed bookings,
-- commission records, and payment reconciliation states.

create type public.payment_status as enum (
  'order_creating',
  'order_created',
  'payment_processing',
  'captured',
  'captured_review',
  'failed',
  'expired',
  'refunded'
);

create type public.booking_status as enum (
  'confirmed',
  'cancelled',
  'completed',
  'disputed',
  'refunded'
);

create type public.commission_collection_status as enum (
  'collected_from_advance',
  'partially_collected_owner_due',
  'settled',
  'waived'
);

create type public.webhook_processing_status as enum (
  'received',
  'processed',
  'ignored',
  'requires_review',
  'failed'
);

revoke all on type public.payment_status from public;
revoke all on type public.booking_status from public;
revoke all on type public.commission_collection_status from public;
revoke all on type public.webhook_processing_status from public;

grant usage on type public.payment_status to authenticated, service_role;
grant usage on type public.booking_status to authenticated, service_role;
grant usage on type public.commission_collection_status
  to authenticated, service_role;
grant usage on type public.webhook_processing_status to service_role;

alter table public.booking_holds
  add column payment_processing_at timestamptz;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_hold_id uuid not null unique
    references public.booking_holds(id) on delete restrict,
  player_user_id uuid not null references auth.users(id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  status public.payment_status not null default 'order_creating',
  amount_subunits integer not null default 50000,
  currency text not null default 'INR',
  razorpay_order_receipt text not null unique,
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  gateway_order_status text,
  gateway_payment_status text,
  order_claim_token uuid,
  order_claimed_at timestamptz,
  order_created_at timestamptz,
  checkout_return_verified_at timestamptz,
  captured_at timestamptz,
  failed_at timestamptz,
  failure_code text,
  failure_description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint payments_amount_fixed check (amount_subunits = 50000),
  constraint payments_currency_inr check (currency = 'INR'),
  constraint payments_receipt_length
    check (char_length(razorpay_order_receipt) between 8 and 40),
  constraint payments_order_fields check (
    (status in ('order_creating', 'expired'))
    or (
      razorpay_order_id is not null
      and order_created_at is not null
    )
  ),
  constraint payments_payment_fields check (
    status not in ('payment_processing', 'captured', 'captured_review', 'refunded')
    or razorpay_payment_id is not null
  ),
  constraint payments_capture_fields check (
    status not in ('captured', 'captured_review', 'refunded')
    or captured_at is not null
  ),
  constraint payments_failed_fields check (
    status <> 'failed'
    or failed_at is not null
  )
);

create index payments_player_created_idx
  on public.payments (player_user_id, created_at desc);

create index payments_owner_created_idx
  on public.payments (owner_user_id, created_at desc);

create index payments_status_created_idx
  on public.payments (status, created_at desc);

create index payments_unfinished_order_idx
  on public.payments (order_claimed_at)
  where razorpay_order_id is null;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_hold_id uuid not null unique
    references public.booking_holds(id) on delete restrict,
  payment_id uuid not null unique references public.payments(id) on delete restrict,
  player_user_id uuid not null references auth.users(id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  venue_id uuid references public.venues(id) on delete set null,
  court_id uuid references public.courts(id) on delete set null,
  sport_id uuid references public.sports(id) on delete set null,
  slot_id uuid references public.slots(id) on delete set null,
  status public.booking_status not null default 'confirmed',
  snapshot_venue_name text not null,
  snapshot_venue_city public.tricity_city not null,
  snapshot_venue_area text not null,
  snapshot_court_name text not null,
  snapshot_court_type text not null,
  snapshot_sport_name text not null,
  snapshot_start_time timestamptz not null,
  snapshot_end_time timestamptz not null,
  snapshot_duration_minutes integer not null,
  snapshot_total_amount numeric(10, 2) not null,
  snapshot_advance_amount numeric(10, 2) not null,
  confirmed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bookings_window_order
    check (snapshot_end_time > snapshot_start_time),
  constraint bookings_duration_positive
    check (snapshot_duration_minutes > 0),
  constraint bookings_duration_matches_window
    check (
      snapshot_end_time =
        snapshot_start_time + make_interval(mins => snapshot_duration_minutes)
    ),
  constraint bookings_amounts_valid
    check (
      snapshot_total_amount >= 0
      and snapshot_advance_amount = 500
    )
);

create index bookings_player_created_idx
  on public.bookings (player_user_id, created_at desc);

create index bookings_owner_created_idx
  on public.bookings (owner_user_id, created_at desc);

create index bookings_court_window_idx
  on public.bookings (court_id, snapshot_start_time, snapshot_end_time)
  where status = 'confirmed';

create table public.commission_records (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete restrict,
  payment_id uuid not null unique references public.payments(id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  total_booking_amount numeric(10, 2) not null,
  advance_amount numeric(10, 2) not null,
  commission_rate numeric(5, 4) not null default 0.05,
  commission_amount numeric(10, 2) not null,
  collected_from_advance numeric(10, 2) not null,
  owner_advance_credit numeric(10, 2) not null,
  owner_due_amount numeric(10, 2) not null,
  collection_status public.commission_collection_status not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint commission_amounts_nonnegative check (
    total_booking_amount >= 0
    and advance_amount = 500
    and commission_amount >= 0
    and collected_from_advance >= 0
    and owner_advance_credit >= 0
    and owner_due_amount >= 0
  ),
  constraint commission_rate_fixed check (commission_rate = 0.05),
  constraint commission_calculation_matches check (
    commission_amount = round(total_booking_amount * commission_rate, 2)
    and collected_from_advance = least(commission_amount, advance_amount)
    and owner_advance_credit = greatest(advance_amount - commission_amount, 0)
    and owner_due_amount = greatest(commission_amount - advance_amount, 0)
  ),
  constraint commission_status_matches check (
    (
      owner_due_amount = 0
      and collection_status in ('collected_from_advance', 'settled', 'waived')
    )
    or (
      owner_due_amount > 0
      and collection_status in (
        'partially_collected_owner_due',
        'settled',
        'waived'
      )
    )
  )
);

create index commission_owner_created_idx
  on public.commission_records (owner_user_id, created_at desc);

create index commission_owner_due_idx
  on public.commission_records (owner_user_id, owner_due_amount)
  where owner_due_amount > 0
    and collection_status = 'partially_collected_owner_due';

create table public.razorpay_webhook_events (
  event_id text primary key,
  event_type text not null,
  payload_sha256 text not null,
  payload jsonb not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  processing_status public.webhook_processing_status not null default 'received',
  result jsonb not null default '{}'::jsonb,
  error_message text,
  received_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  constraint razorpay_event_id_length
    check (char_length(event_id) between 3 and 200),
  constraint razorpay_event_type_length
    check (char_length(event_type) between 3 and 120),
  constraint razorpay_payload_hash_format
    check (payload_sha256 ~ '^[a-f0-9]{64}$')
);

create index razorpay_events_received_idx
  on public.razorpay_webhook_events (received_at desc);

create index razorpay_events_order_idx
  on public.razorpay_webhook_events (razorpay_order_id)
  where razorpay_order_id is not null;

create index razorpay_events_payment_idx
  on public.razorpay_webhook_events (razorpay_payment_id)
  where razorpay_payment_id is not null;

alter table public.booking_audit_logs
  add column payment_id uuid references public.payments(id) on delete set null,
  add column booking_id uuid references public.bookings(id) on delete set null;

create index booking_audit_payment_created_idx
  on public.booking_audit_logs (payment_id, created_at desc)
  where payment_id is not null;

create index booking_audit_booking_created_idx
  on public.booking_audit_logs (booking_id, created_at desc)
  where booking_id is not null;

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create trigger commission_records_set_updated_at
before update on public.commission_records
for each row execute function public.set_updated_at();

create or replace function private.write_payment_audit(
  p_hold public.booking_holds,
  p_action text,
  p_payment_id uuid default null,
  p_booking_id uuid default null,
  p_actor_user_id uuid default null,
  p_details jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.booking_audit_logs (
    booking_hold_id,
    payment_id,
    booking_id,
    player_user_id,
    owner_user_id,
    venue_id,
    actor_user_id,
    action,
    old_status,
    new_status,
    details
  )
  values (
    p_hold.id,
    p_payment_id,
    p_booking_id,
    p_hold.player_user_id,
    p_hold.owner_user_id,
    p_hold.venue_id,
    p_actor_user_id,
    p_action,
    p_hold.status,
    p_hold.status,
    coalesce(p_details, '{}'::jsonb)
  );
$$;

create or replace function private.claim_my_razorpay_order(
  p_hold_id uuid,
  p_claim_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_hold public.booking_holds%rowtype;
  target_payment public.payments%rowtype;
  should_create boolean := false;
  generated_receipt text;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if not private.is_player_account() then
    raise exception 'player_account_required' using errcode = '42501';
  end if;

  perform private.release_expired_booking_holds();

  select *
  into target_hold
  from public.booking_holds
  where id = p_hold_id
    and player_user_id = current_user_id
  for update;

  if not found then
    raise exception 'booking_hold_not_found' using errcode = 'P0002';
  end if;

  if target_hold.status <> 'payment_pending'
    or target_hold.expires_at <= timezone('utc', now()) then
    raise exception 'booking_hold_not_payable' using errcode = 'P0001';
  end if;

  generated_receipt :=
    'plyz_' || left(replace(target_hold.id::text, '-', ''), 32);

  insert into public.payments (
    booking_hold_id,
    player_user_id,
    owner_user_id,
    status,
    razorpay_order_receipt,
    order_claim_token,
    order_claimed_at
  )
  values (
    target_hold.id,
    target_hold.player_user_id,
    target_hold.owner_user_id,
    'order_creating',
    generated_receipt,
    p_claim_token,
    timezone('utc', now())
  )
  on conflict (booking_hold_id) do nothing;

  select *
  into target_payment
  from public.payments
  where booking_hold_id = target_hold.id
  for update;

  if target_payment.razorpay_order_id is not null then
    should_create := false;
  elsif target_payment.order_claim_token = p_claim_token then
    should_create := true;
  elsif target_payment.order_claimed_at is null
    or target_payment.order_claimed_at <
      timezone('utc', now()) - interval '60 seconds' then
    update public.payments
    set
      status = 'order_creating',
      order_claim_token = p_claim_token,
      order_claimed_at = timezone('utc', now()),
      failure_code = null,
      failure_description = null
    where id = target_payment.id
    returning * into target_payment;

    should_create := true;
  end if;

  return jsonb_build_object(
    'payment_id', target_payment.id,
    'hold_id', target_hold.id,
    'receipt', target_payment.razorpay_order_receipt,
    'amount_subunits', target_payment.amount_subunits,
    'currency', target_payment.currency,
    'razorpay_order_id', target_payment.razorpay_order_id,
    'should_create', should_create,
    'expires_at', target_hold.expires_at,
    'venue_name', target_hold.snapshot_venue_name,
    'sport_name', target_hold.snapshot_sport_name
  );
end;
$$;

create or replace function public.claim_my_razorpay_order(
  p_hold_id uuid,
  p_claim_token uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.claim_my_razorpay_order(p_hold_id, p_claim_token);
$$;

create or replace function private.register_razorpay_order(
  p_payment_id uuid,
  p_claim_token uuid,
  p_order_id text,
  p_amount_subunits integer,
  p_currency text,
  p_gateway_order_status text,
  p_gateway_created_at timestamptz
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_payment public.payments%rowtype;
  target_hold public.booking_holds%rowtype;
begin
  select *
  into target_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'payment_not_found' using errcode = 'P0002';
  end if;

  if target_payment.razorpay_order_id is not null then
    if target_payment.razorpay_order_id <> p_order_id then
      raise exception 'payment_order_conflict' using errcode = '23505';
    end if;
    return target_payment;
  end if;

  if target_payment.order_claim_token is distinct from p_claim_token then
    raise exception 'payment_order_claim_mismatch' using errcode = '42501';
  end if;

  if p_amount_subunits <> target_payment.amount_subunits
    or p_currency <> target_payment.currency
    or p_gateway_order_status not in ('created', 'attempted') then
    raise exception 'invalid_razorpay_order' using errcode = '22023';
  end if;

  select *
  into target_hold
  from public.booking_holds
  where id = target_payment.booking_hold_id
  for update;

  if target_hold.status <> 'payment_pending'
    or target_hold.expires_at <= timezone('utc', now()) then
    raise exception 'booking_hold_not_payable' using errcode = 'P0001';
  end if;

  update public.payments
  set
    status = 'order_created',
    razorpay_order_id = p_order_id,
    gateway_order_status = p_gateway_order_status,
    order_created_at = coalesce(
      p_gateway_created_at,
      timezone('utc', now())
    ),
    order_claim_token = null,
    order_claimed_at = null
  where id = target_payment.id
  returning * into target_payment;

  perform private.write_payment_audit(
    target_hold,
    'razorpay_order_created',
    target_payment.id,
    null,
    target_hold.player_user_id,
    jsonb_build_object(
      'razorpay_order_id', p_order_id,
      'amount_subunits', p_amount_subunits,
      'currency', p_currency
    )
  );

  return target_payment;
end;
$$;

create or replace function public.register_razorpay_order(
  p_payment_id uuid,
  p_claim_token uuid,
  p_order_id text,
  p_amount_subunits integer,
  p_currency text,
  p_gateway_order_status text,
  p_gateway_created_at timestamptz
)
returns public.payments
language sql
security invoker
set search_path = ''
as $$
  select private.register_razorpay_order(
    p_payment_id,
    p_claim_token,
    p_order_id,
    p_amount_subunits,
    p_currency,
    p_gateway_order_status,
    p_gateway_created_at
  );
$$;

create or replace function private.release_razorpay_order_claim(
  p_payment_id uuid,
  p_claim_token uuid,
  p_failure_code text,
  p_failure_description text
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.payments
  set
    order_claim_token = null,
    order_claimed_at = null,
    failure_code = left(nullif(p_failure_code, ''), 120),
    failure_description = left(nullif(p_failure_description, ''), 500)
  where id = p_payment_id
    and razorpay_order_id is null
    and order_claim_token = p_claim_token;
$$;

create or replace function public.release_razorpay_order_claim(
  p_payment_id uuid,
  p_claim_token uuid,
  p_failure_code text,
  p_failure_description text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.release_razorpay_order_claim(
    p_payment_id,
    p_claim_token,
    p_failure_code,
    p_failure_description
  );
$$;

create or replace function private.mark_razorpay_payment_processing(
  p_order_id text,
  p_payment_id text,
  p_amount_subunits integer,
  p_currency text,
  p_gateway_payment_status text
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_payment public.payments%rowtype;
  target_hold public.booking_holds%rowtype;
begin
  select *
  into target_payment
  from public.payments
  where razorpay_order_id = p_order_id
  for update;

  if not found then
    raise exception 'payment_order_not_found' using errcode = 'P0002';
  end if;

  if p_amount_subunits <> target_payment.amount_subunits
    or p_currency <> target_payment.currency
    or p_gateway_payment_status not in ('authorized', 'captured') then
    raise exception 'invalid_razorpay_payment_return' using errcode = '22023';
  end if;

  if target_payment.razorpay_payment_id is not null
    and target_payment.razorpay_payment_id <> p_payment_id then
    raise exception 'payment_identifier_conflict' using errcode = '23505';
  end if;

  update public.payments
  set
    status = case
      when status in ('captured', 'captured_review', 'refunded') then status
      else 'payment_processing'
    end,
    razorpay_payment_id = coalesce(razorpay_payment_id, p_payment_id),
    gateway_payment_status = p_gateway_payment_status,
    checkout_return_verified_at = timezone('utc', now())
  where id = target_payment.id
  returning * into target_payment;

  select *
  into target_hold
  from public.booking_holds
  where id = target_payment.booking_hold_id
  for update;

  if target_hold.status = 'payment_pending' then
    update public.booking_holds
    set payment_processing_at = timezone('utc', now())
    where id = target_hold.id
    returning * into target_hold;
  end if;

  perform private.write_payment_audit(
    target_hold,
    'razorpay_checkout_return_verified',
    target_payment.id,
    null,
    target_hold.player_user_id,
    jsonb_build_object(
      'razorpay_order_id', p_order_id,
      'razorpay_payment_id', p_payment_id,
      'gateway_payment_status', p_gateway_payment_status
    )
  );

  return target_payment;
end;
$$;

create or replace function public.mark_razorpay_payment_processing(
  p_order_id text,
  p_payment_id text,
  p_amount_subunits integer,
  p_currency text,
  p_gateway_payment_status text
)
returns public.payments
language sql
security invoker
set search_path = ''
as $$
  select private.mark_razorpay_payment_processing(
    p_order_id,
    p_payment_id,
    p_amount_subunits,
    p_currency,
    p_gateway_payment_status
  );
$$;

create or replace function private.process_razorpay_webhook(
  p_event_id text,
  p_event_type text,
  p_payload_sha256 text,
  p_payload jsonb,
  p_order_id text,
  p_payment_id text,
  p_amount_subunits integer,
  p_currency text,
  p_gateway_payment_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer := 0;
  target_payment public.payments%rowtype;
  target_hold public.booking_holds%rowtype;
  result_booking public.bookings%rowtype;
  commission_amount numeric(10, 2);
  collected_amount numeric(10, 2);
  owner_credit numeric(10, 2);
  owner_due numeric(10, 2);
  has_conflict boolean := false;
  result_status public.webhook_processing_status;
  result_payload jsonb;
begin
  insert into public.razorpay_webhook_events (
    event_id,
    event_type,
    payload_sha256,
    payload,
    razorpay_order_id,
    razorpay_payment_id
  )
  values (
    p_event_id,
    p_event_type,
    p_payload_sha256,
    p_payload,
    p_order_id,
    p_payment_id
  )
  on conflict (event_id) do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count = 0 then
    return jsonb_build_object(
      'duplicate', true,
      'event_id', p_event_id
    );
  end if;

  select *
  into target_payment
  from public.payments
  where razorpay_order_id = p_order_id
  for update;

  if not found then
    update public.razorpay_webhook_events
    set
      processing_status = 'requires_review',
      result = jsonb_build_object('reason', 'payment_order_not_found'),
      processed_at = timezone('utc', now())
    where event_id = p_event_id;

    return jsonb_build_object(
      'processed', false,
      'requires_review', true,
      'reason', 'payment_order_not_found'
    );
  end if;

  if p_amount_subunits <> target_payment.amount_subunits
    or p_currency <> target_payment.currency then
    update public.razorpay_webhook_events
    set
      processing_status = 'failed',
      error_message = 'payment_amount_or_currency_mismatch',
      processed_at = timezone('utc', now())
    where event_id = p_event_id;

    return jsonb_build_object(
      'processed', false,
      'failed', true,
      'reason', 'payment_amount_or_currency_mismatch',
      'event_id', p_event_id
    );
  end if;

  if target_payment.razorpay_payment_id is not null
    and target_payment.razorpay_payment_id <> p_payment_id then
    update public.razorpay_webhook_events
    set
      processing_status = 'failed',
      error_message = 'payment_identifier_conflict',
      processed_at = timezone('utc', now())
    where event_id = p_event_id;

    return jsonb_build_object(
      'processed', false,
      'failed', true,
      'reason', 'payment_identifier_conflict',
      'event_id', p_event_id
    );
  end if;

  select *
  into target_hold
  from public.booking_holds
  where id = target_payment.booking_hold_id
  for update;

  if p_event_type = 'payment.failed' then
    if target_payment.status in ('captured', 'captured_review', 'refunded') then
      result_status := 'ignored';
      result_payload := jsonb_build_object(
        'reason', 'payment_already_captured',
        'payment_status', target_payment.status
      );
    else
    update public.payments
    set
      status = 'failed',
      razorpay_payment_id = coalesce(razorpay_payment_id, p_payment_id),
      gateway_payment_status = p_gateway_payment_status,
      failed_at = timezone('utc', now()),
      failure_code = left(p_payload #>> '{payload,payment,entity,error_code}', 120),
      failure_description = left(
        p_payload #>> '{payload,payment,entity,error_description}',
        500
      )
    where id = target_payment.id
    returning * into target_payment;

    if target_hold.status = 'payment_pending' then
      update public.booking_holds
      set
        status = 'expired',
        payment_processing_at = null
      where id = target_hold.id
      returning * into target_hold;

      update public.slots
      set
        status = 'available',
        updated_at = timezone('utc', now())
      where target_hold.court_id is not null
        and court_id = target_hold.court_id
        and status = 'held'
        and start_time < target_hold.snapshot_end_time
        and end_time > target_hold.snapshot_start_time;
    end if;

    perform private.write_payment_audit(
      target_hold,
      'razorpay_payment_failed',
      target_payment.id,
      null,
      null,
      jsonb_build_object(
        'razorpay_payment_id', p_payment_id,
        'gateway_payment_status', p_gateway_payment_status
      )
    );

    result_status := 'processed';
    result_payload := jsonb_build_object(
      'payment_status', 'failed',
      'hold_released', target_hold.status = 'expired'
    );
    end if;
  elsif p_event_type in ('payment.captured', 'order.paid')
    and p_gateway_payment_status = 'captured' then
    if target_hold.court_id is not null then
      perform pg_advisory_xact_lock(
        hashtextextended(target_hold.court_id::text, 0)
      );
    end if;

    if exists (
      select 1
      from public.bookings existing_booking
      where existing_booking.payment_id = target_payment.id
    ) then
      select *
      into result_booking
      from public.bookings
      where payment_id = target_payment.id;

      update public.payments
      set
        status = 'captured',
        razorpay_payment_id = coalesce(razorpay_payment_id, p_payment_id),
        gateway_payment_status = p_gateway_payment_status,
        captured_at = coalesce(captured_at, timezone('utc', now()))
      where id = target_payment.id
      returning * into target_payment;

      result_status := 'processed';
      result_payload := jsonb_build_object(
        'booking_id', result_booking.id,
        'already_confirmed', true
      );
    else
      select exists (
        select 1
        from public.bookings conflicting_booking
        where conflicting_booking.status = 'confirmed'
          and conflicting_booking.court_id = target_hold.court_id
          and conflicting_booking.snapshot_start_time <
            target_hold.snapshot_end_time
          and conflicting_booking.snapshot_end_time >
            target_hold.snapshot_start_time
      ) or exists (
        select 1
        from public.booking_holds conflicting_hold
        where conflicting_hold.id <> target_hold.id
          and conflicting_hold.status = 'payment_pending'
          and conflicting_hold.court_id = target_hold.court_id
          and conflicting_hold.snapshot_start_time <
            target_hold.snapshot_end_time
          and conflicting_hold.snapshot_end_time >
            target_hold.snapshot_start_time
      ) or exists (
        select 1
        from public.slots conflicting_slot
        where conflicting_slot.court_id = target_hold.court_id
          and conflicting_slot.start_time < target_hold.snapshot_end_time
          and conflicting_slot.end_time > target_hold.snapshot_start_time
          and (
            conflicting_slot.status in ('booked', 'blocked')
            or (
              conflicting_slot.status = 'held'
              and target_hold.status <> 'payment_pending'
            )
          )
      )
      into has_conflict;

      if has_conflict then
        update public.payments
        set
          status = 'captured_review',
          razorpay_payment_id = coalesce(razorpay_payment_id, p_payment_id),
          gateway_payment_status = p_gateway_payment_status,
          captured_at = coalesce(captured_at, timezone('utc', now()))
        where id = target_payment.id
        returning * into target_payment;

        perform private.write_payment_audit(
          target_hold,
          'captured_payment_requires_review',
          target_payment.id,
          null,
          null,
          jsonb_build_object(
            'razorpay_payment_id', p_payment_id,
            'reason', 'physical_court_conflict'
          )
        );

        result_status := 'requires_review';
        result_payload := jsonb_build_object(
          'payment_status', 'captured_review',
          'reason', 'physical_court_conflict'
        );
      else
        update public.payments
        set
          status = 'captured',
          razorpay_payment_id = coalesce(razorpay_payment_id, p_payment_id),
          gateway_payment_status = p_gateway_payment_status,
          captured_at = coalesce(captured_at, timezone('utc', now()))
        where id = target_payment.id
        returning * into target_payment;

        update public.booking_holds
        set
          status = 'converted',
          converted_at = timezone('utc', now()),
          payment_processing_at = coalesce(
            payment_processing_at,
            timezone('utc', now())
          )
        where id = target_hold.id
        returning * into target_hold;

        update public.slots
        set
          status = 'booked',
          updated_at = timezone('utc', now())
        where target_hold.court_id is not null
          and court_id = target_hold.court_id
          and start_time < target_hold.snapshot_end_time
          and end_time > target_hold.snapshot_start_time
          and status in ('available', 'held');

        insert into public.bookings (
          booking_hold_id,
          payment_id,
          player_user_id,
          owner_user_id,
          venue_id,
          court_id,
          sport_id,
          slot_id,
          status,
          snapshot_venue_name,
          snapshot_venue_city,
          snapshot_venue_area,
          snapshot_court_name,
          snapshot_court_type,
          snapshot_sport_name,
          snapshot_start_time,
          snapshot_end_time,
          snapshot_duration_minutes,
          snapshot_total_amount,
          snapshot_advance_amount
        )
        values (
          target_hold.id,
          target_payment.id,
          target_hold.player_user_id,
          target_hold.owner_user_id,
          target_hold.venue_id,
          target_hold.court_id,
          target_hold.sport_id,
          target_hold.slot_id,
          'confirmed',
          target_hold.snapshot_venue_name,
          target_hold.snapshot_venue_city,
          target_hold.snapshot_venue_area,
          target_hold.snapshot_court_name,
          target_hold.snapshot_court_type,
          target_hold.snapshot_sport_name,
          target_hold.snapshot_start_time,
          target_hold.snapshot_end_time,
          target_hold.snapshot_duration_minutes,
          target_hold.snapshot_total_amount,
          target_hold.snapshot_advance_amount
        )
        returning * into result_booking;

        commission_amount :=
          round(target_hold.snapshot_total_amount * 0.05, 2);
        collected_amount :=
          least(commission_amount, target_hold.snapshot_advance_amount);
        owner_credit :=
          greatest(target_hold.snapshot_advance_amount - commission_amount, 0);
        owner_due :=
          greatest(commission_amount - target_hold.snapshot_advance_amount, 0);

        insert into public.commission_records (
          booking_id,
          payment_id,
          owner_user_id,
          total_booking_amount,
          advance_amount,
          commission_rate,
          commission_amount,
          collected_from_advance,
          owner_advance_credit,
          owner_due_amount,
          collection_status
        )
        values (
          result_booking.id,
          target_payment.id,
          target_hold.owner_user_id,
          target_hold.snapshot_total_amount,
          target_hold.snapshot_advance_amount,
          0.05,
          commission_amount,
          collected_amount,
          owner_credit,
          owner_due,
          case
            when owner_due > 0
              then 'partially_collected_owner_due'
                ::public.commission_collection_status
            else 'collected_from_advance'
              ::public.commission_collection_status
          end
        );

        perform private.write_payment_audit(
          target_hold,
          'booking_confirmed_after_webhook',
          target_payment.id,
          result_booking.id,
          null,
          jsonb_build_object(
            'razorpay_payment_id', p_payment_id,
            'commission_amount', commission_amount,
            'owner_due_amount', owner_due
          )
        );

        result_status := 'processed';
        result_payload := jsonb_build_object(
          'booking_id', result_booking.id,
          'payment_status', 'captured',
          'commission_amount', commission_amount,
          'owner_due_amount', owner_due
        );
      end if;
    end if;
  else
    result_status := 'ignored';
    result_payload := jsonb_build_object(
      'reason', 'unsupported_or_nonfinal_event',
      'gateway_payment_status', p_gateway_payment_status
    );
  end if;

  update public.razorpay_webhook_events
  set
    processing_status = result_status,
    result = result_payload,
    processed_at = timezone('utc', now())
  where event_id = p_event_id;

  return result_payload || jsonb_build_object(
    'processed', result_status = 'processed',
    'requires_review', result_status = 'requires_review',
    'event_id', p_event_id
  );
exception
  when others then
    update public.razorpay_webhook_events
    set
      processing_status = 'failed',
      error_message = left(sqlerrm, 500),
      processed_at = timezone('utc', now())
    where event_id = p_event_id;
    raise;
end;
$$;

create or replace function public.process_razorpay_webhook(
  p_event_id text,
  p_event_type text,
  p_payload_sha256 text,
  p_payload jsonb,
  p_order_id text,
  p_payment_id text,
  p_amount_subunits integer,
  p_currency text,
  p_gateway_payment_status text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.process_razorpay_webhook(
    p_event_id,
    p_event_type,
    p_payload_sha256,
    p_payload,
    p_order_id,
    p_payment_id,
    p_amount_subunits,
    p_currency,
    p_gateway_payment_status
  );
$$;

create or replace function private.release_expired_booking_holds()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  expired_hold public.booking_holds%rowtype;
  released_count integer := 0;
begin
  for expired_hold in
    select *
    from public.booking_holds
    where status = 'payment_pending'
      and payment_processing_at is null
      and expires_at <= timezone('utc', now())
    order by expires_at, id
    for update skip locked
  loop
    if expired_hold.court_id is not null then
      perform pg_advisory_xact_lock(
        hashtextextended(expired_hold.court_id::text, 0)
      );
    end if;

    update public.booking_holds
    set status = 'expired'
    where id = expired_hold.id
      and status = 'payment_pending'
      and payment_processing_at is null
    returning * into expired_hold;

    if not found then
      continue;
    end if;

    update public.payments
    set status = 'expired'
    where booking_hold_id = expired_hold.id
      and status in ('order_creating', 'order_created');

    update public.slots
    set
      status = 'available',
      updated_at = timezone('utc', now())
    where expired_hold.court_id is not null
      and court_id = expired_hold.court_id
      and status = 'held'
      and start_time < expired_hold.snapshot_end_time
      and end_time > expired_hold.snapshot_start_time
      and not exists (
        select 1
        from public.booking_holds active_hold
        where active_hold.status = 'payment_pending'
          and active_hold.id <> expired_hold.id
          and active_hold.court_id = public.slots.court_id
          and active_hold.snapshot_start_time < public.slots.end_time
          and active_hold.snapshot_end_time > public.slots.start_time
      );

    perform private.write_booking_audit(
      expired_hold,
      'booking_hold_expired',
      'payment_pending',
      'expired',
      null,
      jsonb_build_object('expired_at', timezone('utc', now()))
    );

    released_count := released_count + 1;
  end loop;

  return released_count;
end;
$$;

create or replace function private.cancel_my_booking_hold(p_hold_id uuid)
returns public.booking_holds
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_hold public.booking_holds%rowtype;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  perform private.release_expired_booking_holds();

  select *
  into target_hold
  from public.booking_holds
  where id = p_hold_id
    and player_user_id = current_user_id
  for update;

  if not found then
    raise exception 'booking_hold_not_found' using errcode = 'P0002';
  end if;

  if target_hold.status <> 'payment_pending' then
    raise exception 'booking_hold_not_cancellable' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.payments
    where booking_hold_id = target_hold.id
      and (
        razorpay_order_id is not null
        or order_claim_token is not null
        or status in ('payment_processing', 'captured', 'captured_review')
      )
  ) then
    raise exception 'payment_order_already_created' using errcode = 'P0001';
  end if;

  if target_hold.court_id is not null then
    perform pg_advisory_xact_lock(
      hashtextextended(target_hold.court_id::text, 0)
    );
  end if;

  update public.booking_holds
  set
    status = 'cancelled',
    cancelled_at = timezone('utc', now())
  where id = target_hold.id
  returning * into target_hold;

  update public.slots
  set
    status = 'available',
    updated_at = timezone('utc', now())
  where target_hold.court_id is not null
    and court_id = target_hold.court_id
    and status = 'held'
    and start_time < target_hold.snapshot_end_time
    and end_time > target_hold.snapshot_start_time;

  perform private.write_booking_audit(
    target_hold,
    'booking_hold_cancelled',
    'payment_pending',
    'cancelled',
    current_user_id,
    jsonb_build_object('cancelled_at', target_hold.cancelled_at)
  );

  return target_hold;
end;
$$;

alter table public.payments enable row level security;
alter table public.bookings enable row level security;
alter table public.commission_records enable row level security;
alter table public.razorpay_webhook_events enable row level security;

revoke all on public.payments from anon, authenticated;
revoke all on public.bookings from anon, authenticated;
revoke all on public.commission_records from anon, authenticated;
revoke all on public.razorpay_webhook_events from anon, authenticated;

grant select on public.payments to authenticated;
grant select on public.bookings to authenticated;
grant select on public.commission_records to authenticated;

create policy "Accounts can read eligible payments"
  on public.payments
  for select
  to authenticated
  using (
    (
      (select private.is_player_account())
      and player_user_id = (select auth.uid())
    )
    or (
      (select private.is_owner_account())
      and owner_user_id = (select auth.uid())
    )
  );

create policy "Accounts can read eligible bookings"
  on public.bookings
  for select
  to authenticated
  using (
    (
      (select private.is_player_account())
      and player_user_id = (select auth.uid())
    )
    or (
      (select private.is_owner_account())
      and owner_user_id = (select auth.uid())
    )
  );

create policy "Owners can read their commission records"
  on public.commission_records
  for select
  to authenticated
  using (
    (select private.is_owner_account())
    and owner_user_id = (select auth.uid())
  );

revoke all on function private.write_payment_audit(
  public.booking_holds, text, uuid, uuid, uuid, jsonb
) from public, anon, authenticated;
revoke all on function private.claim_my_razorpay_order(uuid, uuid)
  from public, anon;
revoke all on function private.register_razorpay_order(
  uuid, uuid, text, integer, text, text, timestamptz
) from public, anon, authenticated;
revoke all on function private.release_razorpay_order_claim(
  uuid, uuid, text, text
) from public, anon, authenticated;
revoke all on function private.mark_razorpay_payment_processing(
  text, text, integer, text, text
) from public, anon, authenticated;
revoke all on function private.process_razorpay_webhook(
  text, text, text, jsonb, text, text, integer, text, text
) from public, anon, authenticated;

grant execute on function private.claim_my_razorpay_order(uuid, uuid)
  to authenticated;
grant execute on function private.register_razorpay_order(
  uuid, uuid, text, integer, text, text, timestamptz
) to service_role;
grant execute on function private.release_razorpay_order_claim(
  uuid, uuid, text, text
) to service_role;
grant execute on function private.mark_razorpay_payment_processing(
  text, text, integer, text, text
) to service_role;
grant execute on function private.process_razorpay_webhook(
  text, text, text, jsonb, text, text, integer, text, text
) to service_role;

revoke all on function public.claim_my_razorpay_order(uuid, uuid)
  from public, anon;
revoke all on function public.register_razorpay_order(
  uuid, uuid, text, integer, text, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.release_razorpay_order_claim(
  uuid, uuid, text, text
) from public, anon, authenticated;
revoke all on function public.mark_razorpay_payment_processing(
  text, text, integer, text, text
) from public, anon, authenticated;
revoke all on function public.process_razorpay_webhook(
  text, text, text, jsonb, text, text, integer, text, text
) from public, anon, authenticated;

grant execute on function public.claim_my_razorpay_order(uuid, uuid)
  to authenticated;
grant execute on function public.register_razorpay_order(
  uuid, uuid, text, integer, text, text, timestamptz
) to service_role;
grant execute on function public.release_razorpay_order_claim(
  uuid, uuid, text, text
) to service_role;
grant execute on function public.mark_razorpay_payment_processing(
  text, text, integer, text, text
) to service_role;
grant execute on function public.process_razorpay_webhook(
  text, text, text, jsonb, text, text, integer, text, text
) to service_role;

comment on table public.payments is
  'Razorpay order and advance-payment lifecycle. Direct client writes are denied.';

comment on table public.bookings is
  'Webhook-confirmed immutable booking snapshots.';

comment on table public.commission_records is
  'Five-percent commission ledger with advance collection and manual owner-due balance.';

comment on table public.razorpay_webhook_events is
  'Idempotent raw Razorpay webhook event ledger.';
