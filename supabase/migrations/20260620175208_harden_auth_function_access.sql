-- Keep trigger-only SECURITY DEFINER functions outside the exposed API schema.
create or replace function private.audit_profile_change()
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

drop trigger if exists profiles_audit_changes on public.profiles;
create trigger profiles_audit_changes
after insert or update on public.profiles
for each row execute function private.audit_profile_change();

drop function public.audit_profile_change();

create or replace function private.sync_profile_contacts_from_auth()
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

drop trigger if exists auth_users_sync_profile_contacts on auth.users;
create trigger auth_users_sync_profile_contacts
after update of email, phone, email_confirmed_at, phone_confirmed_at
on auth.users
for each row execute function private.sync_profile_contacts_from_auth();

drop function public.sync_profile_contacts_from_auth();

revoke all on function private.audit_profile_change() from public;
revoke all on function private.sync_profile_contacts_from_auth() from public;

-- These two RPCs are intentionally callable only by signed-in users.
revoke all on function public.ensure_my_profile(text) from public;
revoke all on function public.ensure_my_profile(text) from anon;
revoke all on function public.update_my_profile(text, text, text) from public;
revoke all on function public.update_my_profile(text, text, text) from anon;
grant execute on function public.ensure_my_profile(text) to authenticated;
grant execute on function public.update_my_profile(text, text, text) to authenticated;
