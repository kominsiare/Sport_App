-- Module 6 assigned the fictional catalog to a dedicated system owner so
-- payment and commission references stay valid. Keep the refresh isolated
-- from real owner-created venues by the catalog's reserved seed UUID range.

create or replace function private.refresh_demo_catalog_slots()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  affected_count integer := 0;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = current_user_id
      and account_type = 'player'
      and profile_complete
      and can_book
  ) then
    raise exception 'booking_enabled_player_required' using errcode = '42501';
  end if;

  insert into public.slots (
    court_id,
    sport_id,
    start_time,
    end_time,
    duration_minutes,
    price_total,
    status,
    owner_block_reason,
    blocked_by,
    blocked_at
  )
  select
    cs.court_id,
    cs.sport_id,
    generated.slot_start,
    generated.slot_start + make_interval(
      mins => coalesce(cs.duration_minutes, sport.default_duration_minutes)
    ),
    coalesce(cs.duration_minutes, sport.default_duration_minutes),
    court.base_price,
    'available',
    null,
    null,
    null
  from public.court_sports cs
  join public.courts court
    on court.id = cs.court_id
    and court.is_active
  join public.venues venue
    on venue.id = court.venue_id
    and venue.status = 'active'
    and venue.id::text like '10000000-0000-4000-8000-%'
  join public.venue_approvals approval
    on approval.venue_id = venue.id
    and approval.decision = 'approved'
  join public.sports sport
    on sport.id = cs.sport_id
    and sport.is_active
  cross join lateral (
    select (
      (
        timezone('Asia/Kolkata', now())::date + slot_day.day_offset
      ) + make_interval(hours => slot_hour.hour_value)
    ) at time zone 'Asia/Kolkata' as slot_start
    from generate_series(1, 14) as slot_day(day_offset)
    cross join (values (18), (21)) as slot_hour(hour_value)
    where slot_hour.hour_value = 18
      or coalesce(cs.duration_minutes, sport.default_duration_minutes) <= 120
  ) generated
  where cs.is_active
    and generated.slot_start > timezone('utc', now())
  on conflict (court_id, sport_id, start_time) do nothing;

  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;

comment on function public.refresh_demo_catalog_slots() is
  'Idempotently keeps only the fictional demo catalog identified by its reserved seed UUID range supplied with rolling future slots. Real owner-created venues remain owner-managed.';
