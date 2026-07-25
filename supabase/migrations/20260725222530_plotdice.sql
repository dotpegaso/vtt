-- Supersedes the roll-computation portion of start_roll from
-- 20260719073843_dice_roll_rpc.sql to support a "plot" die group
-- (Cosmere plot die), which rolls 1-6 like a d6 but carries symbolic
-- meaning decided client-side rather than a numeric total.
create or replace function start_roll(p_room_id uuid, p_config jsonb)
returns uuid
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_active_count int;
  v_die jsonb;
  v_sides_token text;
  v_sides int;
  v_count int;
  v_results jsonb := '[]'::jsonb;
  v_die_results jsonb;
  v_roll_id uuid;
  i int;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  perform 1 from rooms where id = p_room_id for update;

  select count(*) into v_active_count
    from dice_rolls
    where room_id = p_room_id and status = 'rolling';

  if v_active_count > 0 then
    raise exception 'roll_in_progress';
  end if;

  for v_die in select * from jsonb_array_elements(p_config)
  loop
    v_sides_token := v_die->>'sides';
    v_count := (v_die->>'count')::int;

    if v_sides_token = 'plot' then
      v_sides := 6; -- plot die is physically a d6; face meaning is decided client-side
    else
      v_sides := v_sides_token::int;
      if v_sides not in (2, 4, 6, 8, 10, 12, 20, 100) then
        raise exception 'invalid_die_sides: %', v_sides_token;
      end if;
    end if;

    v_die_results := '[]'::jsonb;
    for i in 1..v_count loop
      v_die_results := v_die_results || to_jsonb(roll_single_die(v_sides));
    end loop;

    v_results := v_results || jsonb_build_object(
      'sides', case when v_sides_token = 'plot' then to_jsonb(v_sides_token) else to_jsonb(v_sides) end,
      'count', v_count,
      'values', v_die_results
    );
  end loop;

  insert into dice_rolls (room_id, roller_id, config, results, status)
  values (p_room_id, v_user_id, p_config, v_results, 'rolling')
  returning id into v_roll_id;

  return v_roll_id;
end;
$$;

grant execute on function start_roll(uuid, jsonb) to authenticated;
