create extension if not exists pg_cron with schema extensions;

create or replace function public.purge_rooms_and_room_images()
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  delete from storage.objects
  where bucket_id = 'room-images';

  delete from public.rooms;
end;
$$;

-- Replace the old inactivity-based job with a full daily purge.
do $$
declare
  v_job record;
begin
  for v_job in
    select jobid
    from cron.job
    where jobname in ('room-reaper', 'daily-room-and-image-purge')
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'daily-room-and-image-purge',
  '0 5 * * *', -- every day at 05:00 UTC
  $$
    select public.purge_rooms_and_room_images();
  $$
);
