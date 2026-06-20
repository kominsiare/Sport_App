-- Pllayz Module 2: authentication, profiles, capabilities, and RLS.
-- Apply through the Supabase SQL Editor or CLI.

create type public.account_type as enum ('player', 'owner');
create type public.tricity_city as enum ('Chandigarh', 'Mohali', 'Panchkula');

grant usage on type public.account_type to authenticated;
grant usage on type public.tricity_city to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_type public.account_type not null,
  full_name text,
  business_name text,
  city public.tricity_city,
  email text,
  phone text,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  profile_complete boolean generated always as (
    case
      when account_type = 'player' then
        nullif(btrim(full_name), '') is not null
        and city is not null
        and (email_verified_at is not null or phone_verified_at is not null)
      when account_type = 'owner' then
        nullif(btrim(full_name), '') is not null
        and nullif(btrim(business_name), '') is not null
        and city is not null
        and email_verified_at is not null
        and phone_verified_at is not null
      else false
    end
  ) stored,
  can_book boolean generated always as (
    account_type = 'player'
    and nullif(btrim(full_name), '') is not null
    and city is not null
    and phone_verified_at is not null
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_full_name_length
    check (full_name is null or char_length(btrim(full_name)) between 2 and 100),
  constraint profiles_business_name_length
    check (business_name is null or char_length(btrim(business_name)) between 2 and 140),
  constraint profiles_owner_business_name
    check (account_type = 'owner' or business_name is null)
);

create unique index profiles_unique_email
  on public.profiles (lower(email))
  where email is not null;

create unique index profiles_unique_phone
  on public.profiles (phone)
  where phone is not null;

comment on table public.profiles is
  'One immutable Player or Venue Owner profile per Supabase Auth identity.';

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.admin_users is
  'Server-owned admin capability. No client role can insert, update, or delete rows.';

create table public.auth_audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.auth_audit_logs is
  'Append-only audit history for profile and account-type events.';

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.auth_audit_logs enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.admin_users from anon, authenticated;
revoke all on public.auth_audit_logs from anon, authenticated;

grant select on public.profiles to authenticated;

create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.prevent_account_type_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.account_type is distinct from new.account_type then
    raise exception 'account_type_is_immutable'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_account_type_change
before update of account_type on public.profiles
for each row execute function public.prevent_account_type_change();

create or replace function public.audit_profile_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.auth_audit_logs (
    actor_user_id,
    action,
    target_user_id,
    old_value,
    new_value
  )
  values (
    auth.uid(),
    case when tg_op = 'INSERT' then 'profile_created' else 'profile_updated' end,
    new.id,
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
    to_jsonb(new)
  );
  return new;
end;
$$;

create trigger profiles_audit_changes
after insert or update on public.profiles
for each row execute function public.audit_profile_change();

create or replace function public.ensure_my_profile(p_account_type text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  requested_type public.account_type;
  auth_record auth.users%rowtype;
  existing_profile public.profiles%rowtype;
  result_profile public.profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'authentication_required'
      using errcode = '28000';
  end if;

  if p_account_type not in ('player', 'owner') then
    raise exception 'invalid_account_type'
      using errcode = '22023';
  end if;

  requested_type := p_account_type::public.account_type;

  select *
  into auth_record
  from auth.users
  where id = current_user_id;

  if not found then
    raise exception 'auth_user_not_found'
      using errcode = 'P0002';
  end if;

  select *
  into existing_profile
  from public.profiles
  where id = current_user_id;

  if found then
    if existing_profile.account_type <> requested_type then
      raise exception 'account_type_conflict'
        using errcode = 'P0001';
    end if;

    update public.profiles
    set
      email = nullif(lower(auth_record.email), ''),
      phone = nullif(auth_record.phone, ''),
      email_verified_at = auth_record.email_confirmed_at,
      phone_verified_at = auth_record.phone_confirmed_at
    where id = current_user_id
    returning * into result_profile;

    return result_profile;
  end if;

  if auth_record.email is not null and exists (
    select 1
    from public.profiles
    where lower(email) = lower(auth_record.email)
      and id <> current_user_id
  ) then
    raise exception 'contact_already_registered'
      using errcode = '23505';
  end if;

  if auth_record.phone is not null and exists (
    select 1
    from public.profiles
    where phone = auth_record.phone
      and id <> current_user_id
  ) then
    raise exception 'contact_already_registered'
      using errcode = '23505';
  end if;

  insert into public.profiles (
    id,
    account_type,
    full_name,
    email,
    phone,
    email_verified_at,
    phone_verified_at
  )
  values (
    current_user_id,
    requested_type,
    nullif(
      btrim(
        coalesce(
          auth_record.raw_user_meta_data ->> 'full_name',
          auth_record.raw_user_meta_data ->> 'name',
          ''
        )
      ),
      ''
    ),
    nullif(lower(auth_record.email), ''),
    nullif(auth_record.phone, ''),
    auth_record.email_confirmed_at,
    auth_record.phone_confirmed_at
  )
  returning * into result_profile;

  return result_profile;
exception
  when unique_violation then
    raise exception 'contact_already_registered'
      using errcode = '23505';
end;
$$;

create or replace function public.update_my_profile(
  p_full_name text,
  p_city text,
  p_business_name text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_profile public.profiles%rowtype;
  requested_city public.tricity_city;
  result_profile public.profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'authentication_required'
      using errcode = '28000';
  end if;

  if nullif(btrim(p_full_name), '') is null
    or char_length(btrim(p_full_name)) not between 2 and 100 then
    raise exception 'invalid_full_name'
      using errcode = '22023';
  end if;

  if p_city not in ('Chandigarh', 'Mohali', 'Panchkula') then
    raise exception 'invalid_city'
      using errcode = '22023';
  end if;
  requested_city := p_city::public.tricity_city;

  select *
  into current_profile
  from public.profiles
  where id = current_user_id;

  if not found then
    raise exception 'profile_not_found'
      using errcode = 'P0002';
  end if;

  if current_profile.account_type = 'owner'
    and (
      nullif(btrim(p_business_name), '') is null
      or char_length(btrim(p_business_name)) not between 2 and 140
    ) then
    raise exception 'invalid_business_name'
      using errcode = '22023';
  end if;

  update public.profiles
  set
    full_name = btrim(p_full_name),
    city = requested_city,
    business_name = case
      when account_type = 'owner' then btrim(p_business_name)
      else null
    end
  where id = current_user_id
  returning * into result_profile;

  return result_profile;
end;
$$;

create or replace function public.sync_profile_contacts_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set
    email = nullif(lower(new.email), ''),
    phone = nullif(new.phone, ''),
    email_verified_at = new.email_confirmed_at,
    phone_verified_at = new.phone_confirmed_at
  where id = new.id;

  return new;
exception
  when unique_violation then
    raise exception 'contact_already_registered'
      using errcode = '23505';
end;
$$;

create trigger auth_users_sync_profile_contacts
after update of email, phone, email_confirmed_at, phone_confirmed_at
on auth.users
for each row execute function public.sync_profile_contacts_from_auth();

revoke all on function public.ensure_my_profile(text) from public;
revoke all on function public.update_my_profile(text, text, text) from public;
grant execute on function public.ensure_my_profile(text) to authenticated;
grant execute on function public.update_my_profile(text, text, text) to authenticated;

revoke all on function public.set_updated_at() from public;
revoke all on function public.prevent_account_type_change() from public;
revoke all on function public.audit_profile_change() from public;
revoke all on function public.sync_profile_contacts_from_auth() from public;
