alter policy "rooms_select_if_participant"
  on rooms
  using (owner_id = auth.uid() or is_room_participant(id));
