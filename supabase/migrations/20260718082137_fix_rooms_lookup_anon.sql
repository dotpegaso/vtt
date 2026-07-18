drop policy "rooms_select_for_join_lookup" on rooms;

create policy "rooms_select_for_join_lookup"
  on rooms for select
  using (true);
