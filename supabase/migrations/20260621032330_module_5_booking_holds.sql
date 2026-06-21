-- Pllayz Module 5: atomic ten-minute booking holds before payment integration.

create extension if not exists btree_gist with schema extensions;

create type public.booking_hold_status as enum (
  'payment_pending',
  'cancelled',
  'expired',
  'converted'
);

revoke all on type public.booking_hold_status from public;
grant usage on type public.booking_hold_status to authenticated;

create table public.booking_holds (
  id uuid primary key default gen_random_uuid(),
  player_user_id uuid not null references auth.users(id) on delete restrict,
  owner_user_id uuid references auth.users(id) on delete set null,
  venue_id uuid references public.venues(id) on delete set null,
  court_id uuid references public.courts(id) on delete set null,
  sport_id uuid references public.sports(id) on delete set null,
  slot_id uuid references public.slots(id) on delete set null,
  status public.booking_hold_status not null default 'payment_pending',
  hold_started_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  cancelled_at timestamptz,
  converted_at timestamptz,
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
  snapshot_advance_amount numeric(10, 2) not null default 500,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint booking_holds_window_order
    check (snapshot_end_time > snapshot_start_time),
  constraint booking_holds_duration_positive
    check (snapshot_duration_minutes > 0),
  constraint booking_holds_duration_matches_window
    check (
      snapshot_end_time =
        snapshot_start_time + make_interval(mins => snapshot_duration_minutes)
    ),
  constraint booking_holds_total_nonnegative
    check (snapshot_total_amount >= 0),
  constraint booking_holds_advance_fixed
    check (snapshot_advance_amount = 500),
  constraint booking_holds_expiry_after_start
    check (expires_at > hold_started_at),
  constraint booking_holds_cancelled_state
    check (
      (status = 'cancelled' and cancelled_at is not null)
      or (status <> 'cancelled' and cancelled_at is null)
    ),
  constraint booking_holds_converted_state
    check (
      (status = 'converted' and converted_at is not null)
      or (status <> 'converted' and converted_at is null)
    ),
  constraint booking_holds_active_references
    check (
      status <> 'payment_pending'
      or (
        owner_user_id is not null
        and venue_id is not null
        and court_id is not null
        and sport_id is not null
        and slot_id is not null
      )
    ),
  constraint booking_holds_no_active_physical_overlap
    exclude using gist (
      court_id with =,
      tstzrange(snapshot_start_time, snapshot_end_time, '[)') with &&
    )
    where (status = 'payment_pending')
);

create unique index booking_holds_one_active_per_player
  on public.booking_holds (player_user_id)
  where status = 'payment_pending';

create index booking_holds_player_created_idx
  on public.booking_holds (player_user_id, created_at desc);

create index booking_holds_owner_created_idx
  on public.booking_holds (owner_user_id, created_at desc);

create index booking_holds_venue_created_idx
  on public.booking_holds (venue_id, created_at desc)
  where venue_id is not null;

create index booking_holds_pending_expiry_idx
  on public.booking_holds (expires_at)
  where status = 'payment_pending';

create table public.booking_audit_logs (
  id bigint generated always as identity primary key,
  booking_hold_id uuid references public.booking_holds(id) on delete set null,
  player_user_id uuid references auth.users(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  venue_id uuid references public.venues(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  old_status public.booking_hold_status,
  new_status public.booking_hold_status,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint booking_audit_action_length
    check (char_length(btrim(action)) between 3 and 100)
);

create index booking_audit_player_created_idx
  on public.booking_audit_logs (player_user_id, created_at desc);

create index booking_audit_owner_created_idx
  on public.booking_audit_logs (owner_user_id, created_at desc);

create index booking_audit_hold_created_idx
  on public.booking_audit_logs (booking_hold_id, created_at desc)
  where booking_hold_id is not null;

create trigger booking_holds_set_updated_at
before update on public.booking_holds
for each row execute function public.set_updated_at();

create or replace function private.write_booking_audit(
  p_hold public.booking_holds,
  p_action text,
  p_old_status public.booking_hold_status,
  p_new_status public.booking_hold_status,
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
    p_hold.player_user_id,
    p_hold.owner_user_id,
    p_hold.venue_id,
    p_actor_user_id,
    p_action,
    p_old_status,
    p_new_status,
    coalesce(p_details, '{}'::jsonb)
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
    returning * into expired_hold;

    if not found then
      continue;
    end if;

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

create or replace function private.create_booking_hold(p_slot_id uuid)
returns public.booking_holds
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  selected_slot record;
  result_hold public.booking_holds%rowtype;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if not private.is_player_account()
    or not exists (
      select 1
      from public.profiles
      where id = current_user_id
        and can_book
    ) then
    raise exception 'booking_enabled_player_required' using errcode = '42501';
  end if;

  perform private.release_expired_booking_holds();

  if exists (
    select 1
    from public.booking_holds
    where player_user_id = current_user_id
      and status = 'payment_pending'
  ) then
    raise exception 'active_booking_hold_exists' using errcode = 'P0001';
  end if;

  select
    s.id as slot_id,
    s.court_id,
    s.sport_id,
    s.start_time,
    s.end_time,
    s.duration_minutes,
    s.price_total,
    s.status as slot_status,
    c.name as court_name,
    c.court_type,
    c.is_active as court_is_active,
    v.id as venue_id,
    v.owner_user_id,
    v.name as venue_name,
    v.city as venue_city,
    v.area as venue_area,
    v.status as venue_status,
    sp.name as sport_name
  into selected_slot
  from public.slots s
  join public.courts c on c.id = s.court_id
  join public.venues v on v.id = c.venue_id
  join public.sports sp on sp.id = s.sport_id
  join public.court_sports cs
    on cs.court_id = s.court_id
    and cs.sport_id = s.sport_id
  join public.venue_approvals va on va.venue_id = v.id
  where s.id = p_slot_id
    and c.is_active
    and cs.is_active
    and sp.is_active
    and v.status = 'active'
    and va.decision = 'approved';

  if not found then
    raise exception 'bookable_slot_not_found' using errcode = 'P0002';
  end if;

  if selected_slot.owner_user_id is null then
    raise exception 'venue_owner_required' using errcode = '23514';
  end if;

  if selected_slot.start_time <= timezone('utc', now()) then
    raise exception 'slot_must_be_future' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(selected_slot.court_id::text, 0)
  );

  perform 1
  from public.slots locked_slot
  where locked_slot.court_id = selected_slot.court_id
    and locked_slot.start_time < selected_slot.end_time
    and locked_slot.end_time > selected_slot.start_time
  order by locked_slot.id
  for update;

  if exists (
    select 1
    from public.slots conflicting_slot
    where conflicting_slot.court_id = selected_slot.court_id
      and conflicting_slot.start_time < selected_slot.end_time
      and conflicting_slot.end_time > selected_slot.start_time
      and conflicting_slot.status <> 'available'
  ) then
    raise exception 'slot_no_longer_available' using errcode = 'P0001';
  end if;

  begin
    insert into public.booking_holds (
      player_user_id,
      owner_user_id,
      venue_id,
      court_id,
      sport_id,
      slot_id,
      status,
      expires_at,
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
      current_user_id,
      selected_slot.owner_user_id,
      selected_slot.venue_id,
      selected_slot.court_id,
      selected_slot.sport_id,
      selected_slot.slot_id,
      'payment_pending',
      timezone('utc', now()) + interval '10 minutes',
      selected_slot.venue_name,
      selected_slot.venue_city,
      selected_slot.venue_area,
      selected_slot.court_name,
      selected_slot.court_type,
      selected_slot.sport_name,
      selected_slot.start_time,
      selected_slot.end_time,
      selected_slot.duration_minutes,
      selected_slot.price_total,
      500
    )
    returning * into result_hold;
  exception
    when unique_violation then
      raise exception 'active_booking_hold_exists' using errcode = 'P0001';
    when exclusion_violation then
      raise exception 'slot_no_longer_available' using errcode = 'P0001';
  end;

  update public.slots
  set
    status = 'held',
    updated_at = timezone('utc', now())
  where court_id = selected_slot.court_id
    and start_time < selected_slot.end_time
    and end_time > selected_slot.start_time
    and status = 'available';

  perform private.write_booking_audit(
    result_hold,
    'booking_hold_created',
    null,
    'payment_pending',
    current_user_id,
    jsonb_build_object(
      'expires_at', result_hold.expires_at,
      'blocked_physical_court', true
    )
  );

  return result_hold;
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

  if target_hold.court_id is not null then
    perform pg_advisory_xact_lock(hashtextextended(target_hold.court_id::text, 0));
  end if;

  if target_hold.status <> 'payment_pending' then
    raise exception 'booking_hold_not_cancellable' using errcode = 'P0001';
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
    and end_time > target_hold.snapshot_start_time
    and not exists (
      select 1
      from public.booking_holds active_hold
      where active_hold.status = 'payment_pending'
        and active_hold.id <> target_hold.id
        and active_hold.court_id = public.slots.court_id
        and active_hold.snapshot_start_time < public.slots.end_time
        and active_hold.snapshot_end_time > public.slots.start_time
    );

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

create or replace function public.create_booking_hold(p_slot_id uuid)
returns public.booking_holds
language sql
security invoker
set search_path = ''
as $$
  select private.create_booking_hold(p_slot_id);
$$;

create or replace function public.cancel_my_booking_hold(p_hold_id uuid)
returns public.booking_holds
language sql
security invoker
set search_path = ''
as $$
  select private.cancel_my_booking_hold(p_hold_id);
$$;

create or replace function public.expire_booking_holds()
returns integer
language sql
security invoker
set search_path = ''
as $$
  select private.release_expired_booking_holds();
$$;

alter table public.booking_holds enable row level security;
alter table public.booking_audit_logs enable row level security;

revoke all on public.booking_holds from anon, authenticated;
revoke all on public.booking_audit_logs from anon, authenticated;

grant select on public.booking_holds to authenticated;
grant select on public.booking_audit_logs to authenticated;

create policy "Accounts can read eligible booking holds"
  on public.booking_holds
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

create policy "Accounts can read eligible booking audit"
  on public.booking_audit_logs
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

revoke all on function private.write_booking_audit(
  public.booking_holds,
  text,
  public.booking_hold_status,
  public.booking_hold_status,
  uuid,
  jsonb
) from public;
revoke all on function private.release_expired_booking_holds() from public;
revoke all on function private.create_booking_hold(uuid) from public;
revoke all on function private.cancel_my_booking_hold(uuid) from public;

grant execute on function private.release_expired_booking_holds() to authenticated;
grant execute on function private.create_booking_hold(uuid) to authenticated;
grant execute on function private.cancel_my_booking_hold(uuid) to authenticated;

revoke all on function public.create_booking_hold(uuid) from public;
revoke all on function public.cancel_my_booking_hold(uuid) from public;
revoke all on function public.expire_booking_holds() from public;
revoke all on function public.create_booking_hold(uuid) from anon;
revoke all on function public.cancel_my_booking_hold(uuid) from anon;
revoke all on function public.expire_booking_holds() from anon;

grant execute on function public.create_booking_hold(uuid) to authenticated;
grant execute on function public.cancel_my_booking_hold(uuid) to authenticated;
grant execute on function public.expire_booking_holds() to authenticated;

comment on table public.booking_holds is
  'Immutable ten-minute pre-payment booking snapshots. Direct client writes are denied.';

comment on table public.booking_audit_logs is
  'Append-only audit history for booking hold lifecycle events.';
