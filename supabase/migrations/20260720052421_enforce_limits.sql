create or replace function insert_stroke(
  p_room_id uuid,
  p_id uuid,
  p_participant_id uuid,
  p_points jsonb,
  p_color text,
  p_width numeric
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  perform 1 from rooms where id = p_room_id for update;

  select count(*) into v_count from strokes where room_id = p_room_id;
  if v_count >= 2000 then
    raise exception 'stroke_limit_reached';
  end if;

  insert into strokes (id, room_id, participant_id, points, color, width)
  values (p_id, p_room_id, p_participant_id, p_points, p_color, p_width);

  return p_id;
end;
$$;

grant execute on function insert_stroke(uuid, uuid, uuid, jsonb, text, numeric) to authenticated;

create or replace function insert_image(
  p_room_id uuid,
  p_storage_path text,
  p_x numeric,
  p_y numeric,
  p_width numeric,
  p_height numeric,
  p_uploaded_by uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_count int;
  v_image_id uuid;
begin
  perform 1 from rooms where id = p_room_id for update;

  select count(*) into v_count from images where room_id = p_room_id;
  if v_count >= 25 then
    raise exception 'image_limit_reached';
  end if;

  insert into images (room_id, storage_path, x, y, width, height, uploaded_by)
  values (p_room_id, p_storage_path, p_x, p_y, p_width, p_height, p_uploaded_by)
  returning id into v_image_id;

  return v_image_id;
end;
$$;

grant execute on function insert_image(uuid, text, numeric, numeric, numeric, numeric, uuid) to authenticated;
