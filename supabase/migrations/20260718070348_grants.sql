-- Schema-level usage — without this, grants on individual tables don't matter.
grant usage on schema public to anon, authenticated;

-- Table-level grants. RLS policies (already in place from Step 9) still
-- control which ROWS these roles can see/touch — this just allows the
-- role to query the table at all.
grant select, insert, update, delete
  on rooms, participants, strokes, images, dice_rolls
  to authenticated;

-- anon role isn't really used in our flow (every user gets signed in
-- anonymously via Supabase Auth, which grants them the `authenticated`
-- role, not `anon`) — but granting select here too is harmless and
-- avoids surprises if any query ever runs before sign-in completes.
grant select
  on rooms, participants, strokes, images, dice_rolls
  to anon;

-- Sequences/functions: our tables use gen_random_uuid() defaults, not
-- serial sequences, so no sequence grants needed. The helper functions
-- (is_room_participant, is_room_gm) are SECURITY DEFINER, so they run
-- as their owner (postgres) regardless of caller's grants — no separate
-- grant needed for those either.
