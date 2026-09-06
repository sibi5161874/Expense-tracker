-- Custom profile picture upload (Settings > Profile). Falls back to the Google OAuth
-- avatar (auth.users user_metadata.avatar_url/picture, read client-side — nothing to
-- migrate there) when a user hasn't uploaded their own; this column overrides that default
-- once set.

alter table public.user_profiles
  add column avatar_url text;

-- Public bucket: avatar images are low-sensitivity (unlike monthly-summaries' financial
-- PDFs, which stay private behind signed URLs) and need to load directly via a public URL
-- everywhere an avatar is shown, with no per-request signing round trip.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Object path convention: "<user_id>/<filename>" — storage.foldername(name) splits that
-- into path segments, so [1] is the owning user's id. Anyone can read (the bucket is
-- public), but only the owning user can write into their own folder.
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_update_own" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_delete_own" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
