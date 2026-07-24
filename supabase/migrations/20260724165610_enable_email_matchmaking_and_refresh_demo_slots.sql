-- Make email-link accounts first-class participants in booking and
-- matchmaking, and keep the fictional catalog's rolling demo availability
-- usable after the original seven-day seed window has elapsed.

alter table public.profiles
  alter column profile_complete set expression as (
    case
      when account_type = 'player' then
        nullif(btrim(full_name), '') is not null
        and city is not null
        and (email_verified_at is not null or phone_verified_at is not null)
      when account_type = 'owner' then
        nullif(btrim(full_name), '') is not null
        and nullif(btrim(business_name), '') is not null
        and city is not null
        and (email_verified_at is not null or phone_verified_at is not null)
      else false
    end
  ),
  alter column can_book set expression as (
    account_type = 'player'
    and nullif(btrim(full_name), '') is not null
    and city is not null
    and (email_verified_at is not null or phone_verified_at is not null)
  );

analyze public.profiles;

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
    and venue.owner_user_id is null
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

create or replace function public.refresh_demo_catalog_slots()
returns integer
language sql
security invoker
set search_path = ''
as $$
  select private.refresh_demo_catalog_slots();
$$;

revoke all on function private.refresh_demo_catalog_slots()
  from public, anon;
grant execute on function private.refresh_demo_catalog_slots()
  to authenticated;

revoke all on function public.refresh_demo_catalog_slots()
  from public, anon;
grant execute on function public.refresh_demo_catalog_slots()
  to authenticated;

comment on function public.refresh_demo_catalog_slots() is
  'Idempotently keeps only the fictional, ownerless demo catalog supplied with rolling future slots. Real owner venues remain owner-managed.';
