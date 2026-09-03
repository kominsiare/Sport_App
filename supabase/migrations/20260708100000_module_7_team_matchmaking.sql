-- Pllayz Module 7: Team opponent matchmaking layered on top of
-- webhook-confirmed bookings. This deliberately does not create another
-- booking hold, Razorpay order, payment, or physical-court lock.

create type public.matchmaking_status as enum (
  'open',
  'matched',
  'cancelled',
  'expired'
);

revoke all on type public.matchmaking_status from public;
grant usage on type public.matchmaking_status to authenticated;

create table public.matchmaking_posts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  host_user_id uuid not null references auth.users(id) on delete restrict,
  opponent_user_id uuid references auth.users(id) on delete set null,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  venue_id uuid references public.venues(id) on delete set null,
  court_id uuid references public.courts(id) on delete set null,
  sport_id uuid references public.sports(id) on delete set null,
  slot_id uuid references public.slots(id) on delete set null,
  status public.matchmaking_status not null default 'open',
  host_team_name text not null,
  opponent_team_name text,
  skill_level text,
  host_note text,
  opponent_note text,
  expires_at timestamptz not null,
  matched_at timestamptz,
  cancelled_at timestamptz,
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
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint matchmaking_team_names_length check (
    char_length(btrim(host_team_name)) between 2 and 80
    and (
      opponent_team_name is null
      or char_length(btrim(opponent_team_name)) between 2 and 80
    )
  ),
  constraint matchmaking_notes_length check (
    (host_note is null or char_length(host_note) <= 240)
    and (opponent_note is null or char_length(opponent_note) <= 240)
  ),
  constraint matchmaking_skill_level_valid check (
    skill_level is null
    or skill_level in ('open', 'friendly', 'balanced', 'competitive')
  ),
  constraint matchmaking_host_opponent_distinct check (
    opponent_user_id is null
    or opponent_user_id <> host_user_id
  ),
  constraint matchmaking_window_order check (snapshot_end_time > snapshot_start_time),
  constraint matchmaking_expiry_window check (
    expires_at <= snapshot_start_time
    and expires_at > created_at
  ),
  constraint matchmaking_status_fields check (
    (
      status = 'open'
      and opponent_user_id is null
      and opponent_team_name is null
      and opponent_note is null
      and matched_at is null
      and cancelled_at is null
    )
    or (
      status = 'matched'
      and opponent_user_id is not null
      and opponent_team_name is not null
      and matched_at is not null
      and cancelled_at is null
    )
    or (
      status = 'cancelled'
      and cancelled_at is not null
    )
    or (
      status = 'expired'
      and matched_at is null
      and cancelled_at is null
    )
  )
);

create unique index matchmaking_posts_one_active_per_booking
  on public.matchmaking_posts (booking_id)
  where status in ('open', 'matched');

create index matchmaking_posts_status_start_idx
  on public.matchmaking_posts (status, snapshot_start_time, created_at desc);

create index matchmaking_posts_host_created_idx
  on public.matchmaking_posts (host_user_id, created_at desc);

create index matchmaking_posts_opponent_created_idx
  on public.matchmaking_posts (opponent_user_id, created_at desc)
  where opponent_user_id is not null;

create index matchmaking_posts_owner_created_idx
  on public.matchmaking_posts (owner_user_id, created_at desc);

create trigger matchmaking_posts_set_updated_at
before update on public.matchmaking_posts
for each row execute function public.set_updated_at();

create or replace view public.matchmaking_feed
with (security_invoker = true)
as
select
  id,
  booking_id,
  host_user_id,
  opponent_user_id,
  owner_user_id,
  venue_id,
  court_id,
  sport_id,
  slot_id,
  status,
  host_team_name,
  opponent_team_name,
  skill_level,
  host_note,
  opponent_note,
  expires_at,
  matched_at,
  cancelled_at,
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
  created_at,
  updated_at
from public.matchmaking_posts;

create or replace function private.expire_matchmaking_posts()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  expired_count integer := 0;
begin
  update public.matchmaking_posts
  set status = 'expired'
  where status = 'open'
    and (
      expires_at <= timezone('utc', now())
      or snapshot_start_time <= timezone('utc', now())
    );

  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

create or replace function private.create_matchmaking_post(
  p_booking_id uuid,
  p_team_name text,
  p_skill_level text default null,
  p_note text default null
)
returns public.matchmaking_posts
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_booking public.bookings%rowtype;
  result_post public.matchmaking_posts%rowtype;
  normalized_team_name text := nullif(btrim(p_team_name), '');
  normalized_skill_level text := nullif(btrim(p_skill_level), '');
  normalized_note text := nullif(btrim(p_note), '');
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

  if normalized_team_name is null
    or char_length(normalized_team_name) < 2
    or char_length(normalized_team_name) > 80 then
    raise exception 'team_name_required' using errcode = '22023';
  end if;

  if normalized_skill_level is not null
    and normalized_skill_level not in (
      'open',
      'friendly',
      'balanced',
      'competitive'
    ) then
    raise exception 'invalid_skill_level' using errcode = '22023';
  end if;

  if normalized_note is not null and char_length(normalized_note) > 240 then
    raise exception 'matchmaking_note_too_long' using errcode = '22023';
  end if;

  perform private.expire_matchmaking_posts();

  select *
  into target_booking
  from public.bookings
  where id = p_booking_id
    and player_user_id = current_user_id
    and status = 'confirmed'
  for update;

  if not found then
    raise exception 'confirmed_booking_not_found' using errcode = 'P0002';
  end if;

  if target_booking.snapshot_start_time <= timezone('utc', now()) then
    raise exception 'matchmaking_booking_must_be_future' using errcode = 'P0001';
  end if;

  begin
    insert into public.matchmaking_posts (
      booking_id,
      host_user_id,
      owner_user_id,
      venue_id,
      court_id,
      sport_id,
      slot_id,
      status,
      host_team_name,
      skill_level,
      host_note,
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
      snapshot_total_amount
    )
    values (
      target_booking.id,
      target_booking.player_user_id,
      target_booking.owner_user_id,
      target_booking.venue_id,
      target_booking.court_id,
      target_booking.sport_id,
      target_booking.slot_id,
      'open',
      normalized_team_name,
      coalesce(normalized_skill_level, 'open'),
      normalized_note,
      target_booking.snapshot_start_time,
      target_booking.snapshot_venue_name,
      target_booking.snapshot_venue_city,
      target_booking.snapshot_venue_area,
      target_booking.snapshot_court_name,
      target_booking.snapshot_court_type,
      target_booking.snapshot_sport_name,
      target_booking.snapshot_start_time,
      target_booking.snapshot_end_time,
      target_booking.snapshot_duration_minutes,
      target_booking.snapshot_total_amount
    )
    returning * into result_post;
  exception
    when unique_violation then
      raise exception 'matchmaking_post_exists' using errcode = 'P0001';
  end;

  return result_post;
end;
$$;

create or replace function private.join_matchmaking_post(
  p_post_id uuid,
  p_team_name text,
  p_note text default null
)
returns public.matchmaking_posts
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_post public.matchmaking_posts%rowtype;
  normalized_team_name text := nullif(btrim(p_team_name), '');
  normalized_note text := nullif(btrim(p_note), '');
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

  if normalized_team_name is null
    or char_length(normalized_team_name) < 2
    or char_length(normalized_team_name) > 80 then
    raise exception 'team_name_required' using errcode = '22023';
  end if;

  if normalized_note is not null and char_length(normalized_note) > 240 then
    raise exception 'matchmaking_note_too_long' using errcode = '22023';
  end if;

  perform private.expire_matchmaking_posts();

  select *
  into target_post
  from public.matchmaking_posts
  where id = p_post_id
  for update;

  if not found then
    raise exception 'matchmaking_post_not_found' using errcode = 'P0002';
  end if;

  if target_post.host_user_id = current_user_id then
    raise exception 'cannot_join_own_match' using errcode = 'P0001';
  end if;

  if target_post.status <> 'open'
    or target_post.expires_at <= timezone('utc', now())
    or target_post.snapshot_start_time <= timezone('utc', now()) then
    raise exception 'matchmaking_post_not_open' using errcode = 'P0001';
  end if;

  update public.matchmaking_posts
  set
    status = 'matched',
    opponent_user_id = current_user_id,
    opponent_team_name = normalized_team_name,
    opponent_note = normalized_note,
    matched_at = timezone('utc', now())
  where id = target_post.id
    and status = 'open'
  returning * into target_post;

  if not found then
    raise exception 'matchmaking_post_not_open' using errcode = 'P0001';
  end if;

  return target_post;
end;
$$;

create or replace function private.cancel_my_matchmaking_post(p_post_id uuid)
returns public.matchmaking_posts
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_post public.matchmaking_posts%rowtype;
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  perform private.expire_matchmaking_posts();

  select *
  into target_post
  from public.matchmaking_posts
  where id = p_post_id
  for update;

  if not found then
    raise exception 'matchmaking_post_not_found' using errcode = 'P0002';
  end if;

  if target_post.host_user_id = current_user_id
    and target_post.status in ('open', 'matched') then
    update public.matchmaking_posts
    set
      status = 'cancelled',
      cancelled_at = timezone('utc', now())
    where id = target_post.id
    returning * into target_post;

    return target_post;
  end if;

  if target_post.opponent_user_id = current_user_id
    and target_post.status = 'matched' then
    update public.matchmaking_posts
    set
      status = 'open',
      opponent_user_id = null,
      opponent_team_name = null,
      opponent_note = null,
      matched_at = null
    where id = target_post.id
    returning * into target_post;

    return target_post;
  end if;

  raise exception 'matchmaking_post_not_cancellable' using errcode = '42501';
end;
$$;

create or replace function public.create_matchmaking_post(
  p_booking_id uuid,
  p_team_name text,
  p_skill_level text default null,
  p_note text default null
)
returns public.matchmaking_posts
language sql
security invoker
set search_path = ''
as $$
  select private.create_matchmaking_post(
    p_booking_id,
    p_team_name,
    p_skill_level,
    p_note
  );
$$;

create or replace function public.join_matchmaking_post(
  p_post_id uuid,
  p_team_name text,
  p_note text default null
)
returns public.matchmaking_posts
language sql
security invoker
set search_path = ''
as $$
  select private.join_matchmaking_post(p_post_id, p_team_name, p_note);
$$;

create or replace function public.cancel_my_matchmaking_post(p_post_id uuid)
returns public.matchmaking_posts
language sql
security invoker
set search_path = ''
as $$
  select private.cancel_my_matchmaking_post(p_post_id);
$$;

create or replace function public.expire_matchmaking_posts()
returns integer
language sql
security invoker
set search_path = ''
as $$
  select private.expire_matchmaking_posts();
$$;

alter table public.matchmaking_posts enable row level security;

revoke all on public.matchmaking_posts from anon, authenticated;
revoke all on public.matchmaking_feed from anon, authenticated;

grant select on public.matchmaking_posts to authenticated;
grant select on public.matchmaking_feed to authenticated;

create policy "Accounts can read eligible matchmaking posts"
  on public.matchmaking_posts
  for select
  to authenticated
  using (
    (
      (select private.is_player_account())
      and (
        (
          status = 'open'
          and expires_at > timezone('utc', now())
          and snapshot_start_time > timezone('utc', now())
        )
        or host_user_id = (select auth.uid())
        or opponent_user_id = (select auth.uid())
      )
    )
    or (
      (select private.is_owner_account())
      and owner_user_id = (select auth.uid())
    )
  );

revoke all on function private.expire_matchmaking_posts()
  from public, anon;
revoke all on function private.create_matchmaking_post(uuid, text, text, text)
  from public, anon;
revoke all on function private.join_matchmaking_post(uuid, text, text)
  from public, anon;
revoke all on function private.cancel_my_matchmaking_post(uuid)
  from public, anon;

grant execute on function private.expire_matchmaking_posts() to authenticated;
grant execute on function private.create_matchmaking_post(uuid, text, text, text)
  to authenticated;
grant execute on function private.join_matchmaking_post(uuid, text, text)
  to authenticated;
grant execute on function private.cancel_my_matchmaking_post(uuid)
  to authenticated;

revoke all on function public.create_matchmaking_post(uuid, text, text, text)
  from public, anon;
revoke all on function public.join_matchmaking_post(uuid, text, text)
  from public, anon;
revoke all on function public.cancel_my_matchmaking_post(uuid)
  from public, anon;
revoke all on function public.expire_matchmaking_posts()
  from public, anon;

grant execute on function public.create_matchmaking_post(uuid, text, text, text)
  to authenticated;
grant execute on function public.join_matchmaking_post(uuid, text, text)
  to authenticated;
grant execute on function public.cancel_my_matchmaking_post(uuid)
  to authenticated;
grant execute on function public.expire_matchmaking_posts()
  to authenticated;

comment on table public.matchmaking_posts is
  'Opponent-finder listings for confirmed bookings. Joining a listing never creates a Razorpay order or a second booking.';

comment on view public.matchmaking_feed is
  'RLS-protected player and owner feed of opponent-finder listings without contact details.';
