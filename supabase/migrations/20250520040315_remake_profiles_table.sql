-- 1. Create or alter the profiles table with all required fields
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  profile_picture text, -- store the image URL from Supabase Storage (profile-pictures bucket) only
  created_at timestamp with time zone default timezone('utc'::text, now()),
  last_profile_update timestamp with time zone,
  last_password_change timestamp with time zone
);

-- Ensure profile_picture column exists and is of type text, and only stores URLs
alter table public.profiles
  drop column if exists profile_picture;
alter table public.profiles
  add column if not exists profile_picture text;

-- Optional: Add a check constraint to ensure only URLs are stored (starts with 'http')
alter table public.profiles
  drop constraint if exists profile_picture_is_url;
alter table public.profiles
  add constraint profile_picture_is_url
    check (profile_picture is null or profile_picture ~ '^https?://');

-- Remove avatar_url column if it exists
alter table public.profiles
  drop column if exists avatar_url;

-- Remove points and level columns if they exist
alter table public.profiles drop column if exists points;
alter table public.profiles drop column if exists level;

-- 2. Add unique indexes
create unique index if not exists profiles_email_unique_idx on public.profiles(email) where email is not null;
create unique index if not exists profiles_username_unique_idx on public.profiles(username) where username is not null;

-- 3. Add comments for new columns
comment on column public.profiles.last_profile_update is 'Timestamp of last profile update';
comment on column public.profiles.last_password_change is 'Timestamp of last password change';
comment on column public.profiles.profile_picture is 'User profile picture stored as a public URL from Supabase Storage (profile-pictures bucket) only.';

-- 4. Trigger: Auto-create profile on new user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 5. Backfill: Insert missing profiles for existing users
insert into public.profiles (id, email, username)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'username', null)
from auth.users u
where u.id not in (select id from public.profiles);

-- 6. RLS: Enable and allow users to select/update/insert their own profile
alter table public.profiles enable row level security;

drop policy if exists "Allow individual access to own profile" on public.profiles;
create policy "Allow individual access to own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Allow individual update to own profile" on public.profiles;
create policy "Allow individual update to own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Allow individual insert to own profile" on public.profiles;
create policy "Allow individual insert to own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- 7. Storage: Create 'profile-pictures' bucket if not exists (idempotent)
insert into storage.buckets (id, name, public)
select 'profile-pictures', 'profile-pictures', true
where not exists (select 1 from storage.buckets where id = 'profile-pictures');

-- 8. Storage: RLS Policies for 'profile-pictures' bucket
-- NOTE: The following policies CANNOT be managed by migrations because only the Supabase project owner can alter storage.objects policies.
-- To enable secure profile image management, copy and run the following SQL in the Supabase SQL editor as the project owner:
--
-- drop policy if exists "Allow public read on profile-pictures" on storage.objects;
-- create policy "Allow public read on profile-pictures"
--   on storage.objects
--   for select
--   using (
--     bucket_id = 'profile-pictures'
--   );
--
-- drop policy if exists "Allow user manage own profile picture" on storage.objects;
-- create policy "Allow user manage own profile picture"
--   on storage.objects
--   for all
--   using (
--     bucket_id = 'profile-pictures'
--     and (
--       request.method() = 'GET'
--       or (
--         request.method() in ('POST', 'PUT', 'DELETE')
--         and (
--           (auth.uid() is not null)
--           and (
--             (left(name, 5 + length(auth.uid())) = ('user-' || auth.uid()))
--           )
--         )
--       )
--     )
--   );

-- Remove any old/unused avatar/image columns or policies (if present)
-- (Handled above: avatar_url column dropped, only profile_picture remains)

-- 9. Comments for clarity
comment on column public.profiles.profile_picture is 'User profile picture stored as a public URL from Supabase Storage (profile-pictures bucket) only.';
