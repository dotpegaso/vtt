create table rooms (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  owner_id uuid not null,
  gm_id uuid,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  closed boolean not null default false
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null,
  display_name text not null,
  is_owner boolean not null default false,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create table strokes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  points jsonb not null,
  color text not null default '#000000',
  width numeric not null default 3,
  created_at timestamptz not null default now()
);

create table images (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  storage_path text not null,
  x numeric not null default 0,
  y numeric not null default 0,
  width numeric not null,
  height numeric not null,
  rotation numeric not null default 0,
  z_index int not null default 0,
  locked boolean not null default false,
  uploaded_by uuid not null,
  created_at timestamptz not null default now()
);

create table dice_rolls (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  roller_id uuid not null,
  config jsonb not null,
  results jsonb,
  status text not null default 'rolling' check (status in ('rolling', 'done')),
  created_at timestamptz not null default now()
);

-- helpful indexes for the realtime/query patterns
create index idx_participants_room on participants(room_id);
create index idx_strokes_room on strokes(room_id);
create index idx_images_room on images(room_id);
create index idx_dice_rolls_room_status on dice_rolls(room_id, status);

-- Enable Postgres Realtime (postgres_changes) for the tables clients subscribe to.
-- Note: `participants` needs this for online-roster sync fallback; presence itself
-- runs over a separate ephemeral channel, but participants table changes (join/leave)
-- still need to broadcast.
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table strokes;
alter publication supabase_realtime add table images;
alter publication supabase_realtime add table dice_rolls;
