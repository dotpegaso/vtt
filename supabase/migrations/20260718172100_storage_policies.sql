-- Allow authenticated users to upload to room-images bucket
create policy "authenticated_users_can_upload_images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'room-images');

-- Allow authenticated users to read images (redundant if bucket is public, but explicit)
create policy "authenticated_users_can_read_images"
on storage.objects for select
to authenticated
using (bucket_id = 'room-images');

-- Allow public (anon) to read images too, since bucket is public
create policy "public_can_read_images"
on storage.objects for select
to anon
using (bucket_id = 'room-images');
