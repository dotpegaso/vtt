-- Rolls a single die of given sides using Postgres's own random(), which is
-- cryptographically fine for a tabletop game (not a security-critical context,
-- just needs to be fair and not influenceable by the client).
create or replace function roll_single_die(p_sides int)
returns int
language sql
as $$
  select floor(random() * p_sides)::int + 1;
$$;

-- p_config example: [{"sides": 20, "count": 2}, {"sides": 6, "count": 1}]
-- Computes actual results server-side, returns them alongside the roll id.
create or replace function start_roll(p_room_id uuid, p_config jsonb)
returns uuid
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_active_count int;
  v_die jsonb;
  v_results jsonb := '[]'::jsonb;
  v_die_results jsonb;
  v_roll_id uuid;
  i int;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  -- Enforce "one room roll at a time" atomically.
  perform 1 from rooms where id = p_room_id for update;

  select count(*) into v_active_count
    from dice_rolls
    where room_id = p_room_id and status = 'rolling';

  if v_active_count > 0 then
    raise exception 'roll_in_progress';
  end if;

  -- Compute results for each die group in the config.
  for v_die in select * from jsonb_array_elements(p_config)
  loop
    v_die_results := '[]'::jsonb;
    for i in 1..(v_die->>'count')::int loop
      v_die_results := v_die_results || to_jsonb(roll_single_die((v_die->>'sides')::int));
    end loop;

    v_results := v_results || jsonb_build_object(
      'sides', (v_die->>'sides')::int,
      'count', (v_die->>'count')::int,
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

-- Called by the client once the dice-box animation finishes, to mark the
-- roll as done and unblock the next roll.
create or replace function complete_roll(p_roll_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update dice_rolls set status = 'done' where id = p_roll_id and status = 'rolling';
end;
$$;

grant execute on function complete_roll(uuid) to authenticated;
