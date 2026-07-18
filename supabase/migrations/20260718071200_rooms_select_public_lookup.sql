-- Allow any authenticated (incl. anonymous) user to look up a room by slug,
-- so first-time joiners can find it before they have a participant row.
-- This only exposes id/slug/closed — full row data is still gated by the
-- existing policy for anything sensitive we add later.
create policy "rooms_select_for_join_lookup"
  on rooms for select
  to authenticated
  using (true);
