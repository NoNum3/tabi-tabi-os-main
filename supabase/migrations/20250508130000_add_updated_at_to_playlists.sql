-- Add updated_at column to playlists and auto-update trigger

alter table public.playlists
add column if not exists updated_at timestamptz not null default now();

-- Create or replace function to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.playlists;

create trigger set_updated_at
before update on public.playlists
for each row
execute procedure update_updated_at_column(); 