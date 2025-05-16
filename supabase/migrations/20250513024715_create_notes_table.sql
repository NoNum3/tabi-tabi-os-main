-- Notepad app: notes table (Best Practice)
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

-- Index for fast user lookup and ordering by update time
create index if not exists notes_user_id_idx on public.notes(user_id);
create index if not exists notes_user_id_updated_at_idx on public.notes(user_id, updated_at desc);

-- Automatically update updated_at on row update
create or replace function public.update_notes_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_notes_updated_at on public.notes;
create trigger set_notes_updated_at
before update on public.notes
for each row
execute procedure public.update_notes_updated_at_column();

-- Enable RLS and allow users to access only their own notes
alter table public.notes enable row level security;

drop policy if exists "Allow individual access to own notes" on public.notes;
create policy "Allow individual access to own notes" on public.notes
  for select using (auth.uid() = user_id);

drop policy if exists "Allow individual update to own notes" on public.notes;
create policy "Allow individual update to own notes" on public.notes
  for update using (auth.uid() = user_id);

drop policy if exists "Allow individual insert notes" on public.notes;
create policy "Allow individual insert notes" on public.notes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Allow individual delete notes" on public.notes;
create policy "Allow individual delete notes" on public.notes
  for delete using (auth.uid() = user_id);
