-- Keep the player catalog unavailable to anonymous Data API clients.
revoke all on public.venue_catalog from public;
revoke all on public.venue_catalog from anon;
grant select on public.venue_catalog to authenticated;
