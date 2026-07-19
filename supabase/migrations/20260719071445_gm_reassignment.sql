create or replace function reassign_gm(p_room_id uuid, p_online_user_ids uuid[])
returns void
language plpgsql
security definer
as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner from rooms where id = p_room_id;

  if v_owner is null then
    raise exception 'room_not_found';
  end if;

  if v_owner = any(p_online_user_ids) then
    -- Owner is online — they always reclaim GM status
    update rooms set gm_id = v_owner where id = p_room_id;
  else
    -- Owner is offline — GM passes to whoever's been in the room longest
    -- among currently online participants
    update rooms set gm_id = (
      select user_id from participants
      where room_id = p_room_id and user_id = any(p_online_user_ids)
      order by joined_at asc
      limit 1
    ) where id = p_room_id;
  end if;
end;
$$;

grant execute on function reassign_gm(uuid, uuid[]) to authenticated;
