-- Create or replace the function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, avatar_url)
  values (
    new.id,
    new.email,
    null, -- or set a default username if you want
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql;

-- Drop old trigger if it exists
 drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger to call the function after a new user is created
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Backfill: Insert missing profiles for existing users
insert into public.profiles (id, email)
select id, email from auth.users
where id not in (select id from public.profiles);

