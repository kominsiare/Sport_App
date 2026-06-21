-- Merge Player and Owner read policies so PostgreSQL evaluates one permissive
-- policy per table and action.

drop policy "Players can read active sports" on public.sports;
drop policy "Owners can read active sports" on public.sports;
create policy "Accounts can read active sports"
  on public.sports
  for select
  to authenticated
  using (
    is_active
    and (
      (select private.is_player_account())
      or (select private.is_owner_account())
    )
  );

drop policy "Players can read approved venues" on public.venues;
drop policy "Owners can read their venues" on public.venues;
create policy "Accounts can read eligible venues"
  on public.venues
  for select
  to authenticated
  using (
    (
      (select private.is_player_account())
      and private.is_visible_venue(id)
    )
    or (
      (select private.is_owner_account())
      and owner_user_id = (select auth.uid())
    )
  );

drop policy "Players can read approved venue images" on public.venue_images;
drop policy "Owners can read their venue images" on public.venue_images;
create policy "Accounts can read eligible venue images"
  on public.venue_images
  for select
  to authenticated
  using (
    (
      (select private.is_player_account())
      and private.is_visible_venue(venue_id)
    )
    or (
      (select private.is_owner_account())
      and private.owns_venue(venue_id)
    )
  );

drop policy "Players can read approved venue courts" on public.courts;
drop policy "Owners can read their courts" on public.courts;
create policy "Accounts can read eligible courts"
  on public.courts
  for select
  to authenticated
  using (
    (
      is_active
      and (select private.is_player_account())
      and private.is_visible_venue(venue_id)
    )
    or (
      (select private.is_owner_account())
      and private.owns_venue(venue_id)
    )
  );

drop policy "Players can read approved court sports" on public.court_sports;
drop policy "Owners can read their court sports" on public.court_sports;
create policy "Accounts can read eligible court sports"
  on public.court_sports
  for select
  to authenticated
  using (
    (
      is_active
      and (select private.is_player_account())
      and exists (
        select 1
        from public.courts c
        where c.id = court_id
          and c.is_active
          and private.is_visible_venue(c.venue_id)
      )
    )
    or (
      (select private.is_owner_account())
      and private.owns_court(court_id)
    )
  );

drop policy "Players can read approved venue slots" on public.slots;
drop policy "Owners can read their slots" on public.slots;
create policy "Accounts can read eligible slots"
  on public.slots
  for select
  to authenticated
  using (
    (
      (select private.is_player_account())
      and exists (
        select 1
        from public.courts c
        where c.id = court_id
          and c.is_active
          and private.is_visible_venue(c.venue_id)
      )
    )
    or (
      (select private.is_owner_account())
      and exists (
        select 1
        from public.courts c
        join public.venues v on v.id = c.venue_id
        where c.id = court_id
          and v.owner_user_id = (select auth.uid())
      )
    )
  );
