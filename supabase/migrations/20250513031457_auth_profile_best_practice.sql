-- 1. User Profiles Table (Best Practice)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Unique index for email (if not null)
create unique index if not exists profiles_email_unique_idx on public.profiles(email) where email is not null;
-- Unique index for username (if not null)
create unique index if not exists profiles_username_unique_idx on public.profiles(username) where username is not null;

-- 2. Trigger: Auto-create profile on new user (Best Practice)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', null),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 3. Backfill: Insert missing profiles for existing users
insert into public.profiles (id, email)
select id, email from auth.users
where id not in (select id from public.profiles);

-- 4. RLS: Enable and allow users to select/update their own profile
alter table public.profiles enable row level security;

drop policy if exists "Allow individual access to own profile" on public.profiles;
create policy "Allow individual access to own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Allow individual update to own profile" on public.profiles;
create policy "Allow individual update to own profile" on public.profiles
  for update using (auth.uid() = id);
