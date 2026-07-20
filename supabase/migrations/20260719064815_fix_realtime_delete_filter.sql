-- REPLICA IDENTITY FULL makes DELETE (and UPDATE) replication events include
-- the entire old row, not just the primary key. Without this, postgres_changes
-- subscriptions with a `filter` on DELETE events (like room_id=eq.X) can't be
-- evaluated, since the filtered column isn't present in the stripped-down
-- default payload — the event silently never reaches subscribed clients.
alter table strokes replica identity full;
-- alter table images replica identity full;
