-- Pllayz Module 4: ownership-scoped venue operations and seven-day slot management.

alter table public.venues
  add column last_owner_edit_at timestamptz,
  add column submitted_for_review_at timestamptz;

create index venues_owner_user_id_idx
  on public.venues (owner_user_id)
  where owner_user_id is not null;

create index venue_approvals_reviewed_by_idx
  on public.venue_approvals (reviewed_by)
  where reviewed_by is not null;

alter table public.slots
  add column owner_block_reason text,
  add column blocked_by uuid references auth.users(id) on delete set null,
  add column blocked_at timestamptz,
  add constraint slots_owner_block_reason_length check (
    owner_block_reason is null
    or char_length(btrim(owner_block_reason)) between 3 and 240
  ),
  add constraint slots_block_metadata_consistent check (
    (
      status = 'blocked'
      and owner_block_reason is not null
      and blocked_at is not null
    )
    or (
      status <> 'blocked'
      and owner_block_reason is null
      and blocked_by is null
      and blocked_at is null
    )
  );

create index slots_blocked_by_idx
  on public.slots (blocked_by)
  where blocked_by is not null;

create table public.weekly_availability_rules (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null,
  sport_id uuid not null,
  weekday smallint not null,
  start_local time not null,
  end_local time not null,
  duration_minutes integer not null,
  price_total numeric(10, 2) not null,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint weekly_rules_supported_court_sport
    foreign key (court_id, sport_id)
    references public.court_sports(court_id, sport_id)
    on delete cascade,
  constraint weekly_rules_weekday_range check (weekday between 0 and 6),
  constraint weekly_rules_time_order check (end_local > start_local),
  constraint weekly_rules_duration_positive check (duration_minutes > 0),
  constraint weekly_rules_price_nonnegative check (price_total >= 0),
  unique (court_id, sport_id, weekday, start_local, end_local)
);

create index weekly_rules_court_active_idx
  on public.weekly_availability_rules (court_id, is_active);

create index weekly_rules_created_by_idx
  on public.weekly_availability_rules (created_by);

create table public.owner_operation_logs (
  id bigint generated always as identity primary key,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  venue_id uuid references public.venues(id) on delete set null,
  court_id uuid references public.courts(id) on delete set null,
  slot_id uuid references public.slots(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint owner_operation_action_length
    check (char_length(btrim(action)) between 3 and 100)
);

create index owner_operation_logs_owner_created_idx
  on public.owner_operation_logs (owner_user_id, created_at desc);

create index owner_operation_logs_venue_idx
  on public.owner_operation_logs (venue_id)
  where venue_id is not null;

create index owner_operation_logs_court_idx
  on public.owner_operation_logs (court_id)
  where court_id is not null;

create index owner_operation_logs_slot_idx
  on public.owner_operation_logs (slot_id)
  where slot_id is not null;

create trigger weekly_availability_rules_set_updated_at
before update on public.weekly_availability_rules
for each row execute function public.set_updated_at();

create or replace function private.is_owner_account()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and account_type = 'owner'
      and profile_complete
  );
$$;

create or replace function private.owns_venue(p_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.venues
    where id = p_venue_id
      and owner_user_id = (select auth.uid())
  );
$$;

create or replace function private.owns_court(p_court_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.courts c
    join public.venues v on v.id = c.venue_id
    where c.id = p_court_id
      and v.owner_user_id = (select auth.uid())
  );
$$;

create or replace function private.write_owner_operation(
  p_owner_user_id uuid,
  p_action text,
  p_venue_id uuid default null,
  p_court_id uuid default null,
  p_slot_id uuid default null,
  p_details jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.owner_operation_logs (
    owner_user_id,
    venue_id,
    court_id,
    slot_id,
    action,
    details
  )
  values (
    p_owner_user_id,
    p_venue_id,
    p_court_id,
    p_slot_id,
    p_action,
    coalesce(p_details, '{}'::jsonb)
  );
$$;

create or replace function private.enforce_owner_venue_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  review_submission boolean :=
    coalesce(current_setting('app.owner_review_submission', true), '') = 'on';
  material_change boolean := false;
begin
  if current_user_id is null then
    return new;
  end if;

  if not private.is_owner_account() then
    raise exception 'owner_account_required' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    if new.owner_user_id is distinct from current_user_id
      or new.status <> 'draft'
      or new.is_featured
      or new.sort_priority <> 100 then
      raise exception 'invalid_owner_venue_insert' using errcode = '42501';
    end if;

    new.last_owner_edit_at := timezone('utc', now());
    return new;
  end if;

  if old.owner_user_id is distinct from new.owner_user_id then
    raise exception 'venue_owner_is_immutable' using errcode = '42501';
  end if;

  if old.status = 'suspended' then
    raise exception 'suspended_venue_is_read_only' using errcode = '42501';
  end if;

  if old.is_featured is distinct from new.is_featured
    or old.sort_priority is distinct from new.sort_priority then
    raise exception 'admin_managed_venue_fields' using errcode = '42501';
  end if;

  if old.status is distinct from new.status
    and not (
      review_submission
      and new.status = 'pending_review'
      and old.status in ('draft', 'pending_review', 'active')
    ) then
    raise exception 'invalid_owner_venue_status_transition' using errcode = '42501';
  end if;

  material_change :=
    old.slug is distinct from new.slug
    or old.name is distinct from new.name
    or old.city is distinct from new.city
    or old.area is distinct from new.area
    or old.address is distinct from new.address
    or old.latitude is distinct from new.latitude
    or old.longitude is distinct from new.longitude
    or old.description is distinct from new.description
    or old.amenities is distinct from new.amenities;

  if material_change then
    new.last_owner_edit_at := timezone('utc', now());

    if old.status = 'active' then
      new.status := 'pending_review';
      new.submitted_for_review_at := timezone('utc', now());
    end if;
  end if;

  return new;
end;
$$;

create trigger venues_enforce_owner_write
before insert or update on public.venues
for each row execute function private.enforce_owner_venue_write();

create or replace function private.sync_pending_venue_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'pending_review'
    and old.status is distinct from new.status then
    insert into public.venue_approvals (
      venue_id,
      decision,
      reviewed_by,
      review_note,
      reviewed_at
    )
    values (new.id, 'pending', null, null, null)
    on conflict (venue_id) do update
    set
      decision = 'pending',
      reviewed_by = null,
      review_note = null,
      reviewed_at = null,
      updated_at = timezone('utc', now());
  end if;

  return new;
end;
$$;

create trigger venues_sync_pending_approval
after update of status on public.venues
for each row execute function private.sync_pending_venue_approval();

create or replace function private.mark_venue_for_rereview()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_venue_id uuid;
  new_json jsonb := case when tg_op = 'DELETE' then '{}'::jsonb else to_jsonb(new) end;
  old_json jsonb := case when tg_op = 'INSERT' then '{}'::jsonb else to_jsonb(old) end;
begin
  if auth.uid() is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  affected_venue_id := case tg_table_name
    when 'venue_images' then coalesce(
      nullif(new_json ->> 'venue_id', ''),
      nullif(old_json ->> 'venue_id', '')
    )::uuid
    when 'courts' then coalesce(
      nullif(new_json ->> 'venue_id', ''),
      nullif(old_json ->> 'venue_id', '')
    )::uuid
    when 'court_sports' then (
      select c.venue_id
      from public.courts c
      where c.id = coalesce(
        nullif(new_json ->> 'court_id', ''),
        nullif(old_json ->> 'court_id', '')
      )::uuid
    )
    else null
  end;

  if affected_venue_id is not null
    and private.owns_venue(affected_venue_id) then
    perform set_config('app.owner_review_submission', 'on', true);

    update public.venues
    set
      status = 'pending_review',
      submitted_for_review_at = timezone('utc', now()),
      last_owner_edit_at = timezone('utc', now())
    where id = affected_venue_id
      and status = 'active';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger venue_images_mark_for_rereview
after insert or update or delete on public.venue_images
for each row execute function private.mark_venue_for_rereview();

create trigger courts_mark_for_rereview
after insert or update or delete on public.courts
for each row execute function private.mark_venue_for_rereview();

create trigger court_sports_mark_for_rereview
after insert or update or delete on public.court_sports
for each row execute function private.mark_venue_for_rereview();

create or replace function private.enforce_owner_court_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'UPDATE'
    and old.venue_id is distinct from new.venue_id then
    raise exception 'court_venue_is_immutable' using errcode = '42501';
  end if;

  if tg_op = 'DELETE'
    and exists (
      select 1
      from public.slots
      where court_id = old.id
        and status in ('held', 'booked')
    ) then
    raise exception 'court_has_locked_slots' using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger courts_enforce_owner_write
before update or delete on public.courts
for each row execute function private.enforce_owner_court_write();

create or replace function private.prevent_locked_court_sport_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null
    and exists (
      select 1
      from public.slots
      where court_id = old.court_id
        and sport_id = old.sport_id
        and status in ('held', 'booked')
    ) then
    raise exception 'court_sport_has_locked_slots' using errcode = '42501';
  end if;

  return old;
end;
$$;

create trigger court_sports_prevent_locked_delete
before delete on public.court_sports
for each row execute function private.prevent_locked_court_sport_delete();

create or replace function private.audit_owner_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  affected_venue_id uuid;
  affected_court_id uuid;
  details_json jsonb;
  new_json jsonb := case when tg_op = 'DELETE' then '{}'::jsonb else to_jsonb(new) end;
  old_json jsonb := case when tg_op = 'INSERT' then '{}'::jsonb else to_jsonb(old) end;
begin
  if current_user_id is null or not private.is_owner_account() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  affected_venue_id := case tg_table_name
    when 'venues' then nullif(new_json ->> 'id', '')::uuid
    when 'venue_images' then coalesce(
      nullif(new_json ->> 'venue_id', ''),
      nullif(old_json ->> 'venue_id', '')
    )::uuid
    when 'courts' then coalesce(
      nullif(new_json ->> 'venue_id', ''),
      nullif(old_json ->> 'venue_id', '')
    )::uuid
    when 'court_sports' then (
      select c.venue_id
      from public.courts c
      where c.id = coalesce(
        nullif(new_json ->> 'court_id', ''),
        nullif(old_json ->> 'court_id', '')
      )::uuid
    )
    when 'weekly_availability_rules' then (
      select c.venue_id
      from public.courts c
      where c.id = coalesce(
        nullif(new_json ->> 'court_id', ''),
        nullif(old_json ->> 'court_id', '')
      )::uuid
    )
    else null
  end;

  affected_court_id := case tg_table_name
    when 'courts' then nullif(new_json ->> 'id', '')::uuid
    when 'court_sports' then coalesce(
      nullif(new_json ->> 'court_id', ''),
      nullif(old_json ->> 'court_id', '')
    )::uuid
    when 'weekly_availability_rules' then coalesce(
      nullif(new_json ->> 'court_id', ''),
      nullif(old_json ->> 'court_id', '')
    )::uuid
    else null
  end;

  details_json := jsonb_build_object(
    'operation', tg_op,
    'table', tg_table_name,
    'old', case when tg_op in ('UPDATE', 'DELETE') then old_json else null end,
    'new', case when tg_op in ('INSERT', 'UPDATE') then new_json else null end
  );

  perform private.write_owner_operation(
    current_user_id,
    tg_table_name || '_' || lower(tg_op),
    affected_venue_id,
    affected_court_id,
    null,
    details_json
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger venues_audit_owner_changes
after insert or update or delete on public.venues
for each row execute function private.audit_owner_row_change();

create trigger venue_images_audit_owner_changes
after insert or update or delete on public.venue_images
for each row execute function private.audit_owner_row_change();

create trigger courts_audit_owner_changes
after insert or update or delete on public.courts
for each row execute function private.audit_owner_row_change();

create trigger court_sports_audit_owner_changes
after insert or update or delete on public.court_sports
for each row execute function private.audit_owner_row_change();

create trigger weekly_rules_audit_owner_changes
after insert or update or delete on public.weekly_availability_rules
for each row execute function private.audit_owner_row_change();

create or replace function private.submit_my_venue_for_review(p_venue_id uuid)
returns public.venues
language plpgsql
security definer
set search_path = ''
as $$
declare
  result_venue public.venues%rowtype;
begin
  if not private.is_owner_account()
    or not private.owns_venue(p_venue_id) then
    raise exception 'owner_venue_not_found' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.venue_images where venue_id = p_venue_id
  ) then
    raise exception 'venue_image_required' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.courts c
    join public.court_sports cs
      on cs.court_id = c.id
      and cs.is_active
    where c.venue_id = p_venue_id
      and c.is_active
  ) then
    raise exception 'active_court_and_sport_required' using errcode = '23514';
  end if;

  perform set_config('app.owner_review_submission', 'on', true);

  update public.venues
  set
    status = 'pending_review',
    submitted_for_review_at = timezone('utc', now()),
    last_owner_edit_at = timezone('utc', now())
  where id = p_venue_id
    and status <> 'suspended'
  returning * into result_venue;

  if not found then
    raise exception 'venue_cannot_be_submitted' using errcode = '42501';
  end if;

  perform private.write_owner_operation(
    auth.uid(),
    'venue_submitted_for_review',
    p_venue_id,
    null,
    null,
    '{}'::jsonb
  );

  return result_venue;
end;
$$;

create or replace function public.submit_my_venue_for_review(p_venue_id uuid)
returns public.venues
language sql
security invoker
set search_path = ''
as $$
  select private.submit_my_venue_for_review(p_venue_id);
$$;

create or replace function private.refresh_my_venue_slots(p_venue_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_count integer := 0;
begin
  if not private.is_owner_account()
    or not private.owns_venue(p_venue_id) then
    raise exception 'owner_venue_not_found' using errcode = '42501';
  end if;

  update public.slots s
  set
    status = 'cancelled',
    owner_block_reason = null,
    blocked_by = null,
    blocked_at = null,
    updated_at = timezone('utc', now())
  from public.courts c
  where c.id = s.court_id
    and c.venue_id = p_venue_id
    and s.start_time > timezone('utc', now())
    and s.status in ('available', 'cancelled');

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
    rule.court_id,
    rule.sport_id,
    generated.slot_start,
    generated.slot_start + make_interval(mins => rule.duration_minutes),
    rule.duration_minutes,
    rule.price_total,
    'available',
    null,
    null,
    null
  from public.weekly_availability_rules rule
  join public.courts c
    on c.id = rule.court_id
    and c.is_active
    and c.venue_id = p_venue_id
  cross join generate_series(
    timezone('Asia/Kolkata', now())::date,
    timezone('Asia/Kolkata', now())::date + 6,
    interval '1 day'
  ) as calendar_day
  cross join lateral (
    select (
      (
        calendar_day::date
        + rule.start_local
        + make_interval(mins => slot_index * rule.duration_minutes)
      ) at time zone 'Asia/Kolkata'
    ) as slot_start
    from generate_series(
      0,
      (
        extract(epoch from (rule.end_local - rule.start_local))::integer
        / 60
        / rule.duration_minutes
      ) - 1
    ) as slot_index
  ) generated
  where rule.is_active
    and extract(dow from calendar_day)::smallint = rule.weekday
    and generated.slot_start > timezone('utc', now())
  on conflict (court_id, sport_id, start_time) do update
  set
    end_time = excluded.end_time,
    duration_minutes = excluded.duration_minutes,
    price_total = excluded.price_total,
    status = 'available',
    owner_block_reason = null,
    blocked_by = null,
    blocked_at = null,
    updated_at = timezone('utc', now())
  where public.slots.status in ('available', 'cancelled');

  get diagnostics affected_count = row_count;

  perform private.write_owner_operation(
    auth.uid(),
    'venue_slots_refreshed',
    p_venue_id,
    null,
    null,
    jsonb_build_object('generated_or_updated', affected_count)
  );

  return affected_count;
end;
$$;

create or replace function public.refresh_my_venue_slots(p_venue_id uuid)
returns integer
language sql
security invoker
set search_path = ''
as $$
  select private.refresh_my_venue_slots(p_venue_id);
$$;

create or replace function private.set_my_slot_block(
  p_slot_id uuid,
  p_blocked boolean,
  p_reason text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_slot public.slots%rowtype;
  target_venue_id uuid;
  affected_count integer := 0;
begin
  select s.*
  into target_slot
  from public.slots s
  join public.courts c on c.id = s.court_id
  join public.venues v on v.id = c.venue_id
  where s.id = p_slot_id
    and v.owner_user_id = auth.uid();

  if not found or not private.is_owner_account() then
    raise exception 'owner_slot_not_found' using errcode = '42501';
  end if;

  select venue_id
  into target_venue_id
  from public.courts
  where id = target_slot.court_id;

  if target_slot.start_time <= timezone('utc', now())
    or target_slot.status in ('held', 'booked') then
    raise exception 'slot_is_locked' using errcode = '42501';
  end if;

  if p_blocked and (
    nullif(btrim(coalesce(p_reason, '')), '') is null
    or char_length(btrim(p_reason)) not between 3 and 240
  ) then
    raise exception 'block_reason_required' using errcode = '22023';
  end if;

  if p_blocked then
    update public.slots
    set
      status = 'blocked',
      owner_block_reason = btrim(p_reason),
      blocked_by = auth.uid(),
      blocked_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
    where court_id = target_slot.court_id
      and start_time < target_slot.end_time
      and end_time > target_slot.start_time
      and start_time > timezone('utc', now())
      and status = 'available';
  else
    update public.slots
    set
      status = 'available',
      owner_block_reason = null,
      blocked_by = null,
      blocked_at = null,
      updated_at = timezone('utc', now())
    where court_id = target_slot.court_id
      and start_time < target_slot.end_time
      and end_time > target_slot.start_time
      and start_time > timezone('utc', now())
      and status = 'blocked'
      and blocked_by = auth.uid();
  end if;

  get diagnostics affected_count = row_count;

  perform private.write_owner_operation(
    auth.uid(),
    case when p_blocked then 'slot_blocked' else 'slot_unblocked' end,
    target_venue_id,
    target_slot.court_id,
    p_slot_id,
    jsonb_build_object(
      'reason', case when p_blocked then btrim(p_reason) else null end,
      'affected_slots', affected_count,
      'start_time', target_slot.start_time,
      'end_time', target_slot.end_time
    )
  );

  return affected_count;
end;
$$;

create or replace function public.set_my_slot_block(
  p_slot_id uuid,
  p_blocked boolean,
  p_reason text default null
)
returns integer
language sql
security invoker
set search_path = ''
as $$
  select private.set_my_slot_block(p_slot_id, p_blocked, p_reason);
$$;

alter table public.weekly_availability_rules enable row level security;
alter table public.owner_operation_logs enable row level security;

revoke all on public.weekly_availability_rules from anon, authenticated;
revoke all on public.owner_operation_logs from anon, authenticated;

grant select on public.venue_approvals to authenticated;
grant insert, update, delete on public.venues to authenticated;
grant insert, update, delete on public.venue_images to authenticated;
grant insert, update, delete on public.courts to authenticated;
grant insert, update, delete on public.court_sports to authenticated;
grant select, insert, update, delete
  on public.weekly_availability_rules to authenticated;
grant select on public.owner_operation_logs to authenticated;

create policy "Owners can read active sports"
  on public.sports
  for select
  to authenticated
  using (is_active and private.is_owner_account());

create policy "Owners can read their venues"
  on public.venues
  for select
  to authenticated
  using (
    private.is_owner_account()
    and owner_user_id = (select auth.uid())
  );

create policy "Owners can create draft venues"
  on public.venues
  for insert
  to authenticated
  with check (
    private.is_owner_account()
    and owner_user_id = (select auth.uid())
    and status = 'draft'
    and not is_featured
    and sort_priority = 100
  );

create policy "Owners can update their venues"
  on public.venues
  for update
  to authenticated
  using (
    private.is_owner_account()
    and owner_user_id = (select auth.uid())
    and status <> 'suspended'
  )
  with check (
    owner_user_id = (select auth.uid())
  );

create policy "Owners can delete their draft venues"
  on public.venues
  for delete
  to authenticated
  using (
    private.is_owner_account()
    and owner_user_id = (select auth.uid())
    and status = 'draft'
  );

create policy "Owners can read their venue approvals"
  on public.venue_approvals
  for select
  to authenticated
  using (private.owns_venue(venue_id));

create policy "Owners can read their venue images"
  on public.venue_images
  for select
  to authenticated
  using (private.owns_venue(venue_id));

create policy "Owners can create their venue images"
  on public.venue_images
  for insert
  to authenticated
  with check (private.owns_venue(venue_id));

create policy "Owners can update their venue images"
  on public.venue_images
  for update
  to authenticated
  using (private.owns_venue(venue_id))
  with check (private.owns_venue(venue_id));

create policy "Owners can delete their venue images"
  on public.venue_images
  for delete
  to authenticated
  using (private.owns_venue(venue_id));

create policy "Owners can read their courts"
  on public.courts
  for select
  to authenticated
  using (private.owns_venue(venue_id));

create policy "Owners can create their courts"
  on public.courts
  for insert
  to authenticated
  with check (private.owns_venue(venue_id));

create policy "Owners can update their courts"
  on public.courts
  for update
  to authenticated
  using (private.owns_venue(venue_id))
  with check (private.owns_venue(venue_id));

create policy "Owners can delete their courts"
  on public.courts
  for delete
  to authenticated
  using (private.owns_venue(venue_id));

create policy "Owners can read their court sports"
  on public.court_sports
  for select
  to authenticated
  using (private.owns_court(court_id));

create policy "Owners can create their court sports"
  on public.court_sports
  for insert
  to authenticated
  with check (private.owns_court(court_id));

create policy "Owners can update their court sports"
  on public.court_sports
  for update
  to authenticated
  using (private.owns_court(court_id))
  with check (private.owns_court(court_id));

create policy "Owners can delete their court sports"
  on public.court_sports
  for delete
  to authenticated
  using (private.owns_court(court_id));

create policy "Owners can read their slots"
  on public.slots
  for select
  to authenticated
  using (
    private.is_owner_account()
    and exists (
      select 1
      from public.courts c
      join public.venues v on v.id = c.venue_id
      where c.id = court_id
        and v.owner_user_id = (select auth.uid())
    )
  );

create policy "Owners can read their availability rules"
  on public.weekly_availability_rules
  for select
  to authenticated
  using (private.owns_court(court_id));

create policy "Owners can create their availability rules"
  on public.weekly_availability_rules
  for insert
  to authenticated
  with check (
    private.owns_court(court_id)
    and created_by = (select auth.uid())
  );

create policy "Owners can update their availability rules"
  on public.weekly_availability_rules
  for update
  to authenticated
  using (private.owns_court(court_id))
  with check (
    private.owns_court(court_id)
    and created_by = (select auth.uid())
  );

create policy "Owners can delete their availability rules"
  on public.weekly_availability_rules
  for delete
  to authenticated
  using (private.owns_court(court_id));

create policy "Owners can read their operation logs"
  on public.owner_operation_logs
  for select
  to authenticated
  using (
    private.is_owner_account()
    and owner_user_id = (select auth.uid())
  );

revoke all on function private.is_owner_account() from public;
revoke all on function private.owns_venue(uuid) from public;
revoke all on function private.owns_court(uuid) from public;
revoke all on function private.write_owner_operation(
  uuid, text, uuid, uuid, uuid, jsonb
) from public;
revoke all on function private.enforce_owner_venue_write() from public;
revoke all on function private.sync_pending_venue_approval() from public;
revoke all on function private.mark_venue_for_rereview() from public;
revoke all on function private.enforce_owner_court_write() from public;
revoke all on function private.prevent_locked_court_sport_delete() from public;
revoke all on function private.audit_owner_row_change() from public;
revoke all on function private.submit_my_venue_for_review(uuid) from public;
revoke all on function private.refresh_my_venue_slots(uuid) from public;
revoke all on function private.set_my_slot_block(uuid, boolean, text) from public;

grant execute on function private.is_owner_account() to authenticated;
grant execute on function private.owns_venue(uuid) to authenticated;
grant execute on function private.owns_court(uuid) to authenticated;
grant execute on function private.submit_my_venue_for_review(uuid) to authenticated;
grant execute on function private.refresh_my_venue_slots(uuid) to authenticated;
grant execute on function private.set_my_slot_block(uuid, boolean, text) to authenticated;

revoke all on function public.submit_my_venue_for_review(uuid) from public;
revoke all on function public.refresh_my_venue_slots(uuid) from public;
revoke all on function public.set_my_slot_block(uuid, boolean, text) from public;
grant execute on function public.submit_my_venue_for_review(uuid) to authenticated;
grant execute on function public.refresh_my_venue_slots(uuid) to authenticated;
grant execute on function public.set_my_slot_block(uuid, boolean, text) to authenticated;
