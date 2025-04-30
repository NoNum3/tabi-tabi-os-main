create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  title text not null,
  time text,
  description text,
  color text,
  created_at timestamptz not null default now()
);

-- Index for fast user lookup
create index if not exists idx_calendar_events_user_id on public.calendar_events(user_id);

-- RLS: Enable and add policies
alter table public.calendar_events enable row level security;

create policy "Users can view their events"
  on public.calendar_events
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their events"
  on public.calendar_events
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their events"
  on public.calendar_events
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their events"
  on public.calendar_events
  for delete
  using (auth.uid() = user_id);
