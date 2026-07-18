create or replace function join_room(p_slug text, p_display_name text)
returns table (room_id uuid, participant_id uuid)
language plpgsql
security definer
as $$
declare
  v_room_id uuid;
  v_user_id uuid := auth.uid();
  v_participant_count int;
  v_existing_participant_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select id into v_room_id from rooms where slug = p_slug and not closed;
  if v_room_id is null then
    raise exception 'room_not_found';
  end if;

  -- Already a participant? Return existing row instead of erroring —
  -- covers refresh / rejoining after a disconnect.
  select id into v_existing_participant_id
    from participants
    where room_id = v_room_id and user_id = v_user_id;

  if v_existing_participant_id is not null then
    return query select v_room_id, v_existing_participant_id;
    return;
  end if;

  -- Atomic cap check: row-level lock on the room prevents two simultaneous
  -- joiners from both passing the count check before either commits.
  perform 1 from rooms where id = v_room_id for update;

  select count(*) into v_participant_count
    from participants where room_id = v_room_id;

  if v_participant_count >= 8 then
    raise exception 'room_full';
  end if;

  insert into participants (room_id, user_id, display_name, is_owner)
  values (v_room_id, v_user_id, p_display_name, false)
  returning id into v_existing_participant_id;

  return query select v_room_id, v_existing_participant_id;
end;
$$;

grant execute on function join_room(text, text) to authenticated;
