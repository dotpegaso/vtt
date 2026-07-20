create or replace function toggle_image_lock(p_image_id uuid, p_locked boolean)
returns void
language plpgsql
security definer
as $$
declare
  v_room_id uuid;
begin
  select room_id into v_room_id from images where id = p_image_id;

  if v_room_id is null then
    raise exception 'image_not_found';
  end if;

  if not is_room_gm(v_room_id) then
    raise exception 'not_gm';
  end if;

  update images set locked = p_locked where id = p_image_id;
end;
$$;

grant execute on function toggle_image_lock(uuid, boolean) to authenticated;
