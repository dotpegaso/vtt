-- Enable RLS on every table. From this point on, nothing is readable/writable
-- unless a policy explicitly allows it.
alter table rooms enable row level security;
alter table participants enable row level security;
alter table strokes enable row level security;
alter table images enable row level security;
alter table dice_rolls enable row level security;

-- Helper: is the current authenticated user a participant of this room?
-- SECURITY DEFINER + STABLE so it can be reused cheaply across policies
-- without each policy re-writing the same subquery.
create or replace function is_room_participant(p_room_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from participants
    where room_id = p_room_id
      and user_id = auth.uid()
  );
$$;

-- Helper: is the current authenticated user the room's current GM?
create or replace function is_room_gm(p_room_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from rooms
    where id = p_room_id
      and gm_id = auth.uid()
  );
$$;

-- ROOMS
-- Anyone signed in (anon or not) can read a room if they're a participant.
-- Room creation happens via direct insert from the "create room" flow (Step 1),
-- so we allow insert for any authenticated user, and restrict update to the owner.
create policy "rooms_select_if_participant"
  on rooms for select
  using (is_room_participant(id));

create policy "rooms_insert_any_authenticated"
  on rooms for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "rooms_update_owner_or_gm"
  on rooms for update
  using (owner_id = auth.uid() or gm_id = auth.uid());

-- PARTICIPANTS
create policy "participants_select_if_participant"
  on participants for select
  using (is_room_participant(room_id));

create policy "participants_insert_self"
  on participants for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "participants_update_self_or_gm"
  on participants for update
  using (user_id = auth.uid() or is_room_gm(room_id));

-- STROKES
create policy "strokes_select_if_participant"
  on strokes for select
  using (is_room_participant(room_id));

create policy "strokes_insert_if_participant"
  on strokes for insert
  to authenticated
  with check (
    is_room_participant(room_id)
    and participant_id in (
      select id from participants
      where room_id = strokes.room_id and user_id = auth.uid()
    )
  );

-- delete covers "undo last" (own row) and "clear mine" (own rows);
-- GM clear-all is handled via a SECURITY DEFINER RPC later, not this policy.
create policy "strokes_delete_own"
  on strokes for delete
  using (
    participant_id in (
      select id from participants
      where room_id = strokes.room_id and user_id = auth.uid()
    )
  );

-- IMAGES
create policy "images_select_if_participant"
  on images for select
  using (is_room_participant(room_id));

create policy "images_insert_if_participant"
  on images for insert
  to authenticated
  with check (is_room_participant(room_id) and uploaded_by = auth.uid());

-- Update covers move/resize (any participant, as long as not locked) and
-- GM lock/unlock. We can't fully express "not locked" here cleanly against
-- concurrent writes, so the lock check is enforced via RPC in the dice/images
-- phase — this policy just gates room membership.
create policy "images_update_if_participant"
  on images for update
  using (is_room_participant(room_id));

create policy "images_delete_if_participant"
  on images for delete
  using (is_room_participant(room_id));

-- DICE_ROLLS
create policy "dice_rolls_select_if_participant"
  on dice_rolls for select
  using (is_room_participant(room_id));

-- Inserts to dice_rolls happen exclusively through the start_roll() RPC
-- (SECURITY DEFINER, written in the dice phase), which enforces the
-- one-roll-at-a-time rule server-side. No direct insert policy needed
-- for authenticated users beyond what the RPC itself does as its owner.
