-- Supabase may auto-grant newly created public RPCs to Data API roles.
-- Keep owner mutations callable only by signed-in accounts.
revoke all on function public.submit_my_venue_for_review(uuid) from anon;
revoke all on function public.refresh_my_venue_slots(uuid) from anon;
revoke all on function public.set_my_slot_block(uuid, boolean, text) from anon;

grant execute on function public.submit_my_venue_for_review(uuid) to authenticated;
grant execute on function public.refresh_my_venue_slots(uuid) to authenticated;
grant execute on function public.set_my_slot_block(uuid, boolean, text) to authenticated;
