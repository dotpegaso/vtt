create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'room-reaper',
  '0 * * * *', -- every hour
  $$
    delete from rooms where last_active_at < now() - interval '24 hours';
  $$
);
