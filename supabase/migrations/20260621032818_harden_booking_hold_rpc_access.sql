-- Supabase grants function execution to PUBLIC by default. Keep every booking
-- mutation authenticated-only even when this migration follows an already-applied
-- Module 5 schema migration.

revoke all on function public.create_booking_hold(uuid) from public, anon;
revoke all on function public.cancel_my_booking_hold(uuid) from public, anon;
revoke all on function public.expire_booking_holds() from public, anon;

revoke all on function private.release_expired_booking_holds() from public, anon;
revoke all on function private.create_booking_hold(uuid) from public, anon;
revoke all on function private.cancel_my_booking_hold(uuid) from public, anon;

grant execute on function public.create_booking_hold(uuid) to authenticated;
grant execute on function public.cancel_my_booking_hold(uuid) to authenticated;
grant execute on function public.expire_booking_holds() to authenticated;
