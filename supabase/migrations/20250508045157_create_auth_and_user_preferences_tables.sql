-- 1. User Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text unique,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. App Likes Table (for future roadmap)
create table if not exists public.user_app_likes (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  app_id text not null,
  liked_at timestamp with time zone default timezone('utc'::text, now()),
  unique (user_id, app_id)
);

-- 3. App Metadata Table (for like counts, etc.)
create table if not exists public.app_metadata (
  app_id text primary key,
  like_count integer default 0
);

-- 4. User Preferences Table (dashboard layout, etc.)
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_app_ids text[] default '{}',
  app_order text[] default '{}',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Trigger: Auto-create profile on new user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'username')
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
