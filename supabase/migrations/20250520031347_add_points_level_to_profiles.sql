-- Add points and level to user profiles
alter table public.profiles
  add column if not exists points integer default 0,
  add column if not exists level integer default 1,
  add column if not exists last_profile_update timestamp with time zone,
  add column if not exists last_password_change timestamp with time zone;

comment on column public.profiles.points is 'User points for gamification/leveling system';
comment on column public.profiles.level is 'User level, increases with points';
comment on column public.profiles.last_profile_update is 'Timestamp of last profile update';
comment on column public.profiles.last_password_change is 'Timestamp of last password change';

-- RLS policy: Allow users to insert their own profile
drop policy if exists "Allow individual insert to own profile" on public.profiles;
create policy "Allow individual insert to own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Backfill: Insert missing profiles for existing users (id = auth.users.id)
insert into public.profiles (id, email, username, avatar_url)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'username', null),
  coalesce(u.raw_user_meta_data->>'avatar_url', null)
from auth.users u
where u.id not in (select id from public.profiles);
