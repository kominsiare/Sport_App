-- Pllayz Module 3: authenticated Player venue browsing.
-- Fictional Tricity seed data is included for public-beta QA.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.venue_status as enum (
  'draft',
  'pending_review',
  'active',
  'suspended'
);

create type public.venue_approval_decision as enum (
  'pending',
  'approved',
  'rejected'
);

create type public.slot_status as enum (
  'available',
  'held',
  'booked',
  'blocked',
  'cancelled'
);

revoke all on type public.venue_status from public;
revoke all on type public.venue_approval_decision from public;
revoke all on type public.slot_status from public;
grant usage on type public.venue_status to authenticated;
grant usage on type public.venue_approval_decision to authenticated;
grant usage on type public.slot_status to authenticated;

create table public.sports (
  id uuid primary key,
  slug text not null unique,
  name text not null unique,
  default_duration_minutes integer,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  constraint sports_slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint sports_duration_positive
    check (default_duration_minutes is null or default_duration_minutes > 0)
);

create table public.venues (
  id uuid primary key,
  owner_user_id uuid references auth.users(id) on delete restrict,
  slug text not null unique,
  name text not null,
  city public.tricity_city not null,
  area text not null,
  address text not null,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  description text not null,
  status public.venue_status not null default 'draft',
  is_featured boolean not null default false,
  sort_priority integer not null default 100,
  amenities text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint venues_slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint venues_name_length check (char_length(btrim(name)) between 3 and 120),
  constraint venues_area_length check (char_length(btrim(area)) between 2 and 100),
  constraint venues_address_length check (char_length(btrim(address)) between 5 and 240),
  constraint venues_description_length
    check (char_length(btrim(description)) between 20 and 1200),
  constraint venues_latitude_range check (latitude between -90 and 90),
  constraint venues_longitude_range check (longitude between -180 and 180)
);

create index venues_catalog_filter_idx
  on public.venues (status, city, area, is_featured, sort_priority);

create table public.venue_images (
  id uuid primary key,
  venue_id uuid not null references public.venues(id) on delete cascade,
  public_url text not null,
  alt_text text not null,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint venue_images_alt_length
    check (char_length(btrim(alt_text)) between 5 and 180),
  constraint venue_images_url_nonempty check (nullif(btrim(public_url), '') is not null),
  unique (venue_id, public_url)
);

create unique index venue_images_one_primary
  on public.venue_images (venue_id)
  where is_primary;

create table public.venue_approvals (
  venue_id uuid primary key references public.venues(id) on delete cascade,
  decision public.venue_approval_decision not null default 'pending',
  reviewed_by uuid references public.admin_users(user_id) on delete set null,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint venue_approval_reviewed_at check (
    (decision = 'pending' and reviewed_at is null)
    or (decision in ('approved', 'rejected') and reviewed_at is not null)
  )
);

create table public.courts (
  id uuid primary key,
  venue_id uuid not null references public.venues(id) on delete cascade,
  name text not null,
  court_type text not null,
  default_duration_minutes integer,
  base_price numeric(10, 2) not null,
  is_active boolean not null default true,
  attributes_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint courts_name_length check (char_length(btrim(name)) between 2 and 120),
  constraint courts_type_length check (char_length(btrim(court_type)) between 2 and 80),
  constraint courts_duration_positive
    check (default_duration_minutes is null or default_duration_minutes > 0),
  constraint courts_price_nonnegative check (base_price >= 0),
  unique (venue_id, name)
);

create index courts_venue_active_idx on public.courts (venue_id, is_active);

create table public.court_sports (
  court_id uuid not null references public.courts(id) on delete cascade,
  sport_id uuid not null references public.sports(id) on delete restrict,
  duration_minutes integer,
  is_active boolean not null default true,
  sport_specific_attributes_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (court_id, sport_id),
  constraint court_sports_duration_positive
    check (duration_minutes is null or duration_minutes > 0)
);

create index court_sports_sport_active_idx
  on public.court_sports (sport_id, is_active);

create table public.slots (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references public.courts(id) on delete cascade,
  sport_id uuid not null references public.sports(id) on delete restrict,
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_minutes integer not null,
  price_total numeric(10, 2) not null,
  status public.slot_status not null default 'available',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint slots_time_order check (end_time > start_time),
  constraint slots_duration_positive check (duration_minutes > 0),
  constraint slots_price_nonnegative check (price_total >= 0),
  unique (court_id, sport_id, start_time)
);

create index slots_catalog_idx
  on public.slots (court_id, sport_id, start_time, status);

create trigger venues_set_updated_at
before update on public.venues
for each row execute function public.set_updated_at();

create trigger venue_approvals_set_updated_at
before update on public.venue_approvals
for each row execute function public.set_updated_at();

create trigger courts_set_updated_at
before update on public.courts
for each row execute function public.set_updated_at();

create trigger slots_set_updated_at
before update on public.slots
for each row execute function public.set_updated_at();

create or replace function private.require_image_before_venue_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.decision = 'approved' and not exists (
    select 1
    from public.venue_images
    where venue_id = new.venue_id
  ) then
    raise exception 'approved_venue_requires_image'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger venue_approval_requires_image
before insert or update of decision on public.venue_approvals
for each row execute function private.require_image_before_venue_approval();

create or replace function private.prevent_last_approved_venue_image_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.venue_approvals
    where venue_id = old.venue_id
      and decision = 'approved'
  ) and not exists (
    select 1
    from public.venue_images
    where venue_id = old.venue_id
      and id <> old.id
  ) then
    raise exception 'approved_venue_requires_image'
      using errcode = '23514';
  end if;

  return old;
end;
$$;

create trigger venue_images_keep_one_for_approved_venue
before delete on public.venue_images
for each row execute function private.prevent_last_approved_venue_image_delete();

create or replace function private.is_player_account()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and account_type = 'player'
      and profile_complete
  );
$$;

create or replace function private.is_visible_venue(p_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.venues v
    join public.venue_approvals va on va.venue_id = v.id
    where v.id = p_venue_id
      and v.status = 'active'
      and va.decision = 'approved'
  );
$$;

alter table public.sports enable row level security;
alter table public.venues enable row level security;
alter table public.venue_images enable row level security;
alter table public.venue_approvals enable row level security;
alter table public.courts enable row level security;
alter table public.court_sports enable row level security;
alter table public.slots enable row level security;

revoke all on public.sports from anon, authenticated;
revoke all on public.venues from anon, authenticated;
revoke all on public.venue_images from anon, authenticated;
revoke all on public.venue_approvals from anon, authenticated;
revoke all on public.courts from anon, authenticated;
revoke all on public.court_sports from anon, authenticated;
revoke all on public.slots from anon, authenticated;

grant select on public.sports to authenticated;
grant select on public.venues to authenticated;
grant select on public.venue_images to authenticated;
grant select on public.courts to authenticated;
grant select on public.court_sports to authenticated;
grant select on public.slots to authenticated;

create policy "Players can read active sports"
  on public.sports
  for select
  to authenticated
  using (is_active and private.is_player_account());

create policy "Players can read approved venues"
  on public.venues
  for select
  to authenticated
  using (private.is_player_account() and private.is_visible_venue(id));

create policy "Players can read approved venue images"
  on public.venue_images
  for select
  to authenticated
  using (private.is_player_account() and private.is_visible_venue(venue_id));

create policy "Players can read approved venue courts"
  on public.courts
  for select
  to authenticated
  using (
    is_active
    and private.is_player_account()
    and private.is_visible_venue(venue_id)
  );

create policy "Players can read approved court sports"
  on public.court_sports
  for select
  to authenticated
  using (
    is_active
    and private.is_player_account()
    and exists (
      select 1
      from public.courts c
      where c.id = court_id
        and c.is_active
        and private.is_visible_venue(c.venue_id)
    )
  );

create policy "Players can read approved venue slots"
  on public.slots
  for select
  to authenticated
  using (
    private.is_player_account()
    and exists (
      select 1
      from public.courts c
      where c.id = court_id
        and c.is_active
        and private.is_visible_venue(c.venue_id)
    )
  );

revoke all on function private.require_image_before_venue_approval() from public;
revoke all on function private.prevent_last_approved_venue_image_delete() from public;
revoke all on function private.is_player_account() from public;
revoke all on function private.is_visible_venue(uuid) from public;
grant execute on function private.is_player_account() to authenticated;
grant execute on function private.is_visible_venue(uuid) to authenticated;

insert into public.sports (id, slug, name, default_duration_minutes)
values
  ('00000000-0000-4000-8000-000000000001', 'cricket', 'Cricket', 180),
  ('00000000-0000-4000-8000-000000000002', 'football', 'Football', 120),
  ('00000000-0000-4000-8000-000000000003', 'badminton', 'Badminton', 60),
  ('00000000-0000-4000-8000-000000000004', 'pickleball', 'Pickleball', 60),
  ('00000000-0000-4000-8000-000000000005', 'tennis', 'Tennis', 60);

insert into public.venues (
  id,
  slug,
  name,
  city,
  area,
  address,
  latitude,
  longitude,
  description,
  status,
  is_featured,
  sort_priority,
  amenities
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'sector-seven-sports-yard',
    'Sector Seven Sports Yard',
    'Chandigarh',
    'Sector 7',
    'Madhya Marg, Sector 7, Chandigarh',
    30.743145,
    76.801128,
    'A fictional floodlit neighbourhood sports yard with a premium multi-sport turf, clean changing rooms, drinking water and evening play.',
    'active',
    true,
    10,
    array['Floodlights', 'Changing rooms', 'Parking', 'Drinking water']
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'capitol-shuttle-house',
    'Capitol Shuttle House',
    'Chandigarh',
    'Industrial Area Phase I',
    'Plot 24, Industrial Area Phase I, Chandigarh',
    30.705112,
    76.801967,
    'A fictional climate-controlled badminton venue with professional wooden courts, bright lighting, equipment rental and compact spectator seating.',
    'active',
    true,
    20,
    array['Indoor', 'Equipment rental', 'Parking', 'Washrooms']
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'blue-court-commons',
    'Blue Court Commons',
    'Chandigarh',
    'Sector 10',
    'Leisure Valley Road, Sector 10, Chandigarh',
    30.754418,
    76.787119,
    'A fictional garden-side tennis venue with two hard courts, shaded seating, warm-up space and calm evening sessions near central Chandigarh.',
    'active',
    true,
    30,
    array['Floodlights', 'Coaching', 'Seating', 'Parking']
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'lakeview-playfield',
    'Lakeview Playfield',
    'Chandigarh',
    'Sector 26',
    'Grain Market Road, Sector 26, Chandigarh',
    30.729677,
    76.810553,
    'A fictional high-energy football and cricket turf designed for evening groups, with tall netting, digital score display and covered team benches.',
    'active',
    false,
    80,
    array['Floodlights', 'Team benches', 'Parking', 'Cafe']
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'garden-city-racquet-club',
    'Garden City Racquet Club',
    'Chandigarh',
    'Sector 33',
    'Inner Market Road, Sector 33, Chandigarh',
    30.716948,
    76.774563,
    'A fictional community racquet club combining badminton, pickleball and tennis with coaching lanes, lockers and a relaxed players lounge.',
    'active',
    false,
    90,
    array['Indoor', 'Lockers', 'Coaching', 'Players lounge']
  ),
  (
    '10000000-0000-4000-8000-000000000006',
    'the-boundary-chandigarh',
    'The Boundary Chandigarh',
    'Chandigarh',
    'Sector 44',
    'Vikas Marg, Sector 44, Chandigarh',
    30.714813,
    76.751231,
    'A fictional box-cricket and practice venue with multiple enclosed lanes, match-ready turf, bowling markers and late-evening availability.',
    'active',
    false,
    100,
    array['Floodlights', 'Practice nets', 'Equipment rental', 'Parking']
  ),
  (
    '10000000-0000-4000-8000-000000000007',
    'north-grid-arena',
    'North Grid Arena',
    'Chandigarh',
    'Manimajra',
    'Housing Board Chowk Road, Manimajra, Chandigarh',
    30.719782,
    76.832044,
    'A fictional accessible multi-sport arena for football and cricket groups, featuring a full synthetic surface, showers and generous parking.',
    'active',
    false,
    110,
    array['Floodlights', 'Showers', 'Parking', 'First aid']
  ),
  (
    '10000000-0000-4000-8000-000000000008',
    'aerocity-turf-works',
    'AeroCity Turf Works',
    'Mohali',
    'Aerocity',
    'Airport Road, Aerocity, Mohali',
    30.648914,
    76.738218,
    'A fictional destination turf near Airport Road with an immaculate football surface, cricket configuration, team lounge and all-weather lighting.',
    'active',
    true,
    15,
    array['Floodlights', 'Team lounge', 'Parking', 'Cafe']
  ),
  (
    '10000000-0000-4000-8000-000000000009',
    'phase-five-shuttle-lab',
    'Phase Five Shuttle Lab',
    'Mohali',
    'Phase 5',
    'Market Road, Phase 5, Mohali',
    30.718513,
    76.716242,
    'A fictional focused badminton facility with three sprung wooden courts, high-contrast lighting, racket rental and structured coaching sessions.',
    'active',
    false,
    85,
    array['Indoor', 'Coaching', 'Equipment rental', 'Drinking water']
  ),
  (
    '10000000-0000-4000-8000-000000000010',
    'mohali-cricket-loft',
    'Mohali Cricket Loft',
    'Mohali',
    'Phase 8B',
    'Industrial Area, Phase 8B, Mohali',
    30.699518,
    76.691311,
    'A fictional elevated cricket training and box-match venue with fresh turf, high nets, bowling lanes and video-friendly floodlighting.',
    'active',
    true,
    25,
    array['Floodlights', 'Practice nets', 'Changing rooms', 'Parking']
  ),
  (
    '10000000-0000-4000-8000-000000000011',
    'airport-road-racquet-house',
    'Airport Road Racquet House',
    'Mohali',
    'Sector 82',
    'IT City Road, Sector 82, Mohali',
    30.648103,
    76.725412,
    'A fictional contemporary racquet house with premium badminton and pickleball courts, a compact pro shop and comfortable recovery seating.',
    'active',
    false,
    95,
    array['Indoor', 'Pro shop', 'Lockers', 'Parking']
  ),
  (
    '10000000-0000-4000-8000-000000000012',
    'falcon-football-park',
    'Falcon Football Park',
    'Mohali',
    'Sector 68',
    'Kumbra Road, Sector 68, Mohali',
    30.692471,
    76.708404,
    'A fictional football-first facility with a cushioned synthetic pitch, goalkeeping zones, covered dugouts and evening league-style lighting.',
    'active',
    false,
    105,
    array['Floodlights', 'Dugouts', 'Showers', 'Parking']
  ),
  (
    '10000000-0000-4000-8000-000000000013',
    'nexus-pickle-club',
    'Nexus Pickle Club',
    'Mohali',
    'Sector 74',
    'Knowledge City Road, Sector 74, Mohali',
    30.690278,
    76.686919,
    'A fictional social pickleball club with covered blue courts, beginner-friendly coaching, shaded lounge seating and evening open-play sessions.',
    'active',
    false,
    115,
    array['Covered courts', 'Coaching', 'Players lounge', 'Parking']
  ),
  (
    '10000000-0000-4000-8000-000000000014',
    'kharar-play-district',
    'Kharar Play District',
    'Mohali',
    'Sunny Enclave',
    'Main Boulevard, Sunny Enclave, Kharar',
    30.754511,
    76.647227,
    'A fictional value-focused play district offering football, box cricket and badminton with convenient late slots and family seating.',
    'active',
    false,
    125,
    array['Floodlights', 'Family seating', 'Parking', 'Drinking water']
  ),
  (
    '10000000-0000-4000-8000-000000000015',
    'shivalik-tennis-grove',
    'Shivalik Tennis Grove',
    'Panchkula',
    'Sector 3',
    'Golf Club Road, Sector 3, Panchkula',
    30.705802,
    76.842911,
    'A fictional premium tennis grove with mountain-facing hard courts, landscaped warm-up areas, coaching and elegant shaded seating.',
    'active',
    true,
    18,
    array['Floodlights', 'Coaching', 'Seating', 'Parking']
  ),
  (
    '10000000-0000-4000-8000-000000000016',
    'tricity-box-cricket-hub',
    'Tricity Box Cricket Hub',
    'Panchkula',
    'Sector 20',
    'Peer Muchalla Road, Sector 20, Panchkula',
    30.670913,
    76.860382,
    'A fictional box-cricket hub built for competitive evening games, with enclosed turfs, practice strips and a compact players pavilion.',
    'active',
    true,
    28,
    array['Floodlights', 'Practice nets', 'Players pavilion', 'Parking']
  ),
  (
    '10000000-0000-4000-8000-000000000017',
    'panchkula-shuttle-works',
    'Panchkula Shuttle Works',
    'Panchkula',
    'Industrial Area Phase II',
    'Industrial Area Phase II, Panchkula',
    30.688121,
    76.849883,
    'A fictional serious badminton hall with four wooden courts, glare-controlled lighting, equipment rental and ample warm-up space.',
    'active',
    false,
    88,
    array['Indoor', 'Equipment rental', 'Warm-up zone', 'Parking']
  ),
  (
    '10000000-0000-4000-8000-000000000018',
    'ghaggar-sports-commons',
    'Ghaggar Sports Commons',
    'Panchkula',
    'Sector 21',
    'Ghaggar Link Road, Sector 21, Panchkula',
    30.676215,
    76.874182,
    'A fictional open-air sports commons with a versatile football and cricket field, broad sidelines, showers and relaxed group seating.',
    'active',
    false,
    108,
    array['Floodlights', 'Showers', 'Group seating', 'Parking']
  ),
  (
    '10000000-0000-4000-8000-000000000019',
    'mdc-multisport-deck',
    'MDC MultiSport Deck',
    'Panchkula',
    'MDC Sector 5',
    'Mansa Devi Complex, Sector 5, Panchkula',
    30.731122,
    76.846223,
    'A fictional compact urban deck for badminton, pickleball and tennis, with covered courts, lockers and quick access from MDC.',
    'active',
    false,
    118,
    array['Covered courts', 'Lockers', 'Coaching', 'Parking']
  ),
  (
    '10000000-0000-4000-8000-000000000020',
    'kalka-road-pickle-park',
    'Kalka Road Pickle Park',
    'Panchkula',
    'Sector 12-A',
    'Kalka Road, Sector 12-A, Panchkula',
    30.701195,
    76.858982,
    'A fictional welcoming pickleball park with three covered courts, introductory coaching, lounge seating and bright early-evening sessions.',
    'active',
    false,
    128,
    array['Covered courts', 'Coaching', 'Players lounge', 'Drinking water']
  );

insert into public.venue_images (
  id,
  venue_id,
  public_url,
  alt_text,
  is_primary
)
select
  ('30000000-0000-4000-8000-' || lpad(ordinal::text, 12, '0'))::uuid,
  venue_id,
  public_url,
  alt_text,
  true
from (
  values
    (1, '10000000-0000-4000-8000-000000000001'::uuid, '/assets/venues/floodlit-multisport-turf.jpg', 'Floodlit multi-sport turf at Sector Seven Sports Yard'),
    (2, '10000000-0000-4000-8000-000000000002'::uuid, '/assets/venues/indoor-badminton-arena.jpg', 'Indoor wooden badminton courts at Capitol Shuttle House'),
    (3, '10000000-0000-4000-8000-000000000003'::uuid, '/assets/venues/premium-tennis-club.jpg', 'Blue hard tennis courts at Blue Court Commons'),
    (4, '10000000-0000-4000-8000-000000000004'::uuid, '/assets/venues/floodlit-multisport-turf.jpg', 'Evening football and cricket turf at Lakeview Playfield'),
    (5, '10000000-0000-4000-8000-000000000005'::uuid, '/assets/venues/covered-pickleball-club.jpg', 'Covered racquet courts at Garden City Racquet Club'),
    (6, '10000000-0000-4000-8000-000000000006'::uuid, '/assets/venues/cricket-practice-arena.jpg', 'Floodlit box-cricket lanes at The Boundary Chandigarh'),
    (7, '10000000-0000-4000-8000-000000000007'::uuid, '/assets/venues/floodlit-multisport-turf.jpg', 'Synthetic playing surface at North Grid Arena'),
    (8, '10000000-0000-4000-8000-000000000008'::uuid, '/assets/venues/floodlit-multisport-turf.jpg', 'Premium evening turf at AeroCity Turf Works'),
    (9, '10000000-0000-4000-8000-000000000009'::uuid, '/assets/venues/indoor-badminton-arena.jpg', 'Professional courts at Phase Five Shuttle Lab'),
    (10, '10000000-0000-4000-8000-000000000010'::uuid, '/assets/venues/cricket-practice-arena.jpg', 'Cricket lanes at Mohali Cricket Loft'),
    (11, '10000000-0000-4000-8000-000000000011'::uuid, '/assets/venues/indoor-badminton-arena.jpg', 'Indoor racquet courts at Airport Road Racquet House'),
    (12, '10000000-0000-4000-8000-000000000012'::uuid, '/assets/venues/floodlit-multisport-turf.jpg', 'Floodlit pitch at Falcon Football Park'),
    (13, '10000000-0000-4000-8000-000000000013'::uuid, '/assets/venues/covered-pickleball-club.jpg', 'Covered pickleball courts at Nexus Pickle Club'),
    (14, '10000000-0000-4000-8000-000000000014'::uuid, '/assets/venues/floodlit-multisport-turf.jpg', 'Multi-sport fields at Kharar Play District'),
    (15, '10000000-0000-4000-8000-000000000015'::uuid, '/assets/venues/premium-tennis-club.jpg', 'Mountain-facing courts at Shivalik Tennis Grove'),
    (16, '10000000-0000-4000-8000-000000000016'::uuid, '/assets/venues/cricket-practice-arena.jpg', 'Box-cricket arena at Tricity Box Cricket Hub'),
    (17, '10000000-0000-4000-8000-000000000017'::uuid, '/assets/venues/indoor-badminton-arena.jpg', 'Indoor courts at Panchkula Shuttle Works'),
    (18, '10000000-0000-4000-8000-000000000018'::uuid, '/assets/venues/floodlit-multisport-turf.jpg', 'Open multi-sport turf at Ghaggar Sports Commons'),
    (19, '10000000-0000-4000-8000-000000000019'::uuid, '/assets/venues/covered-pickleball-club.jpg', 'Covered racquet deck at MDC MultiSport Deck'),
    (20, '10000000-0000-4000-8000-000000000020'::uuid, '/assets/venues/covered-pickleball-club.jpg', 'Blue and lime courts at Kalka Road Pickle Park')
) as image_seed (ordinal, venue_id, public_url, alt_text);

insert into public.venue_approvals (
  venue_id,
  decision,
  review_note,
  reviewed_at
)
select
  id,
  'approved',
  'Fictional Module 3 demo venue approved for authenticated Player QA.',
  timezone('utc', now())
from public.venues;

insert into public.courts (
  id,
  venue_id,
  name,
  court_type,
  default_duration_minutes,
  base_price,
  attributes_json
)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Central Floodlit Turf', 'Outdoor synthetic turf', null, 2200, '{"surface":"synthetic","covered":false}'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Court One', 'Indoor wooden court', 60, 850, '{"surface":"wood","air_conditioned":true}'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'Court Two', 'Indoor wooden court', 60, 750, '{"surface":"wood","air_conditioned":true}'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', 'Garden Hard Court', 'Outdoor hard court', 60, 1300, '{"surface":"acrylic","covered":false}'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000004', 'Lakeview Main Turf', 'Outdoor synthetic turf', null, 2000, '{"surface":"synthetic","covered":false}'),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000005', 'Racquet Hall', 'Covered multi-court', 60, 900, '{"surface":"acrylic","covered":true}'),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000006', 'Boundary Box One', 'Enclosed cricket turf', 180, 2100, '{"surface":"synthetic","covered":false}'),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000006', 'Practice Lane', 'Cricket practice lane', 60, 700, '{"surface":"matting","covered":true}'),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000007', 'North Grid Turf', 'Outdoor synthetic turf', null, 1800, '{"surface":"synthetic","covered":false}'),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000008', 'Aero Main Turf', 'Outdoor synthetic turf', null, 2500, '{"surface":"synthetic","covered":false}'),
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000009', 'Shuttle Court A', 'Indoor wooden court', 60, 700, '{"surface":"wood","air_conditioned":false}'),
  ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000010', 'Loft Match Box', 'Enclosed cricket turf', 180, 2300, '{"surface":"synthetic","covered":false}'),
  ('20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000010', 'Bowling Lane', 'Cricket practice lane', 60, 650, '{"surface":"matting","covered":true}'),
  ('20000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000011', 'Blue Racquet Hall', 'Indoor acrylic court', 60, 950, '{"surface":"acrylic","air_conditioned":true}'),
  ('20000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000012', 'Falcon Football Pitch', 'Outdoor synthetic turf', 120, 1900, '{"surface":"synthetic","covered":false}'),
  ('20000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000013', 'Nexus Court One', 'Covered pickleball court', 60, 800, '{"surface":"acrylic","covered":true}'),
  ('20000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-000000000014', 'District Main Turf', 'Outdoor synthetic turf', null, 1600, '{"surface":"synthetic","covered":false}'),
  ('20000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000014', 'District Shuttle Court', 'Indoor synthetic court', 60, 600, '{"surface":"synthetic","covered":true}'),
  ('20000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000015', 'Shivalik Championship Court', 'Outdoor hard court', 60, 1500, '{"surface":"acrylic","covered":false}'),
  ('20000000-0000-4000-8000-000000000020', '10000000-0000-4000-8000-000000000016', 'Hub Box One', 'Enclosed cricket turf', 180, 1950, '{"surface":"synthetic","covered":false}'),
  ('20000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000017', 'Shuttle Hall One', 'Indoor wooden court', 60, 750, '{"surface":"wood","air_conditioned":false}'),
  ('20000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000018', 'Ghaggar Main Field', 'Outdoor synthetic turf', null, 1750, '{"surface":"synthetic","covered":false}'),
  ('20000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-000000000019', 'MDC Covered Deck', 'Covered multi-court', 60, 850, '{"surface":"acrylic","covered":true}'),
  ('20000000-0000-4000-8000-000000000024', '10000000-0000-4000-8000-000000000020', 'Pickle Court One', 'Covered pickleball court', 60, 700, '{"surface":"acrylic","covered":true}');

insert into public.court_sports (court_id, sport_id, duration_minutes)
values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 180),
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 120),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', 60),
  ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003', 60),
  ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000005', 60),
  ('20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', 180),
  ('20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000002', 120),
  ('20000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000003', 60),
  ('20000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000004', 60),
  ('20000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000005', 60),
  ('20000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000001', 180),
  ('20000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000001', 60),
  ('20000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000001', 180),
  ('20000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000002', 120),
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000001', 180),
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000002', 120),
  ('20000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000003', 60),
  ('20000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000001', 180),
  ('20000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000001', 60),
  ('20000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000003', 60),
  ('20000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000004', 60),
  ('20000000-0000-4000-8000-000000000015', '00000000-0000-4000-8000-000000000002', 120),
  ('20000000-0000-4000-8000-000000000016', '00000000-0000-4000-8000-000000000004', 60),
  ('20000000-0000-4000-8000-000000000017', '00000000-0000-4000-8000-000000000001', 180),
  ('20000000-0000-4000-8000-000000000017', '00000000-0000-4000-8000-000000000002', 120),
  ('20000000-0000-4000-8000-000000000018', '00000000-0000-4000-8000-000000000003', 60),
  ('20000000-0000-4000-8000-000000000019', '00000000-0000-4000-8000-000000000005', 60),
  ('20000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000001', 180),
  ('20000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000003', 60),
  ('20000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000001', 180),
  ('20000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000002', 120),
  ('20000000-0000-4000-8000-000000000023', '00000000-0000-4000-8000-000000000003', 60),
  ('20000000-0000-4000-8000-000000000023', '00000000-0000-4000-8000-000000000004', 60),
  ('20000000-0000-4000-8000-000000000023', '00000000-0000-4000-8000-000000000005', 60),
  ('20000000-0000-4000-8000-000000000024', '00000000-0000-4000-8000-000000000004', 60);

insert into public.slots (
  court_id,
  sport_id,
  start_time,
  end_time,
  duration_minutes,
  price_total,
  status
)
select
  cs.court_id,
  cs.sport_id,
  slot_start,
  slot_start + make_interval(mins => coalesce(cs.duration_minutes, s.default_duration_minutes)),
  coalesce(cs.duration_minutes, s.default_duration_minutes),
  c.base_price,
  'available'
from public.court_sports cs
join public.courts c on c.id = cs.court_id
join public.sports s on s.id = cs.sport_id
cross join lateral (
  select (
    (
      timezone('Asia/Kolkata', now())::date + slot_day.day_offset
    ) + make_interval(hours => slot_hour.hour_value)
  ) at time zone 'Asia/Kolkata' as slot_start
  from generate_series(1, 7) as slot_day(day_offset)
  cross join (values (18), (21)) as slot_hour(hour_value)
  where slot_hour.hour_value = 18
    or coalesce(cs.duration_minutes, s.default_duration_minutes) <= 120
) generated_slots;

create view public.venue_catalog
with (security_invoker = true)
as
select
  v.id,
  v.slug,
  v.name,
  v.city,
  v.area,
  v.address,
  v.description,
  v.latitude,
  v.longitude,
  v.is_featured,
  v.sort_priority,
  v.amenities,
  min(c.base_price) as from_price,
  (
    select vi.public_url
    from public.venue_images vi
    where vi.venue_id = v.id
    order by vi.is_primary desc, vi.sort_order, vi.created_at
    limit 1
  ) as image_url,
  (
    select vi.alt_text
    from public.venue_images vi
    where vi.venue_id = v.id
    order by vi.is_primary desc, vi.sort_order, vi.created_at
    limit 1
  ) as image_alt,
  array_agg(distinct s.name order by s.name) as sports,
  array_agg(distinct s.slug order by s.slug) as sport_slugs
from public.venues v
join public.courts c on c.venue_id = v.id and c.is_active
join public.court_sports cs on cs.court_id = c.id and cs.is_active
join public.sports s on s.id = cs.sport_id and s.is_active
where v.status = 'active'
group by v.id;

grant select on public.venue_catalog to authenticated;
