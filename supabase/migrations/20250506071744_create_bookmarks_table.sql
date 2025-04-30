-- Create the bookmarks table
create table public.bookmarks (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null check (char_length(title) > 0),
  url text not null check (url ~* '^(https?://.+)$'), -- Basic URL format check
  type text not null default 'general', -- e.g., general, social, work
  created_at timestamp with time zone not null default now()
);

-- Add comments
comment on table public.bookmarks is 'Stores user bookmarks.';
comment on column public.bookmarks.id is 'Unique identifier for the bookmark.';
comment on column public.bookmarks.user_id is 'The user who owns this bookmark.';
comment on column public.bookmarks.title is 'User-defined title for the bookmark.';
comment on column public.bookmarks.url is 'The URL being bookmarked.';
comment on column public.bookmarks.type is 'Category type for the bookmark (e.g., general, social).';
comment on column public.bookmarks.created_at is 'When the bookmark was created.';

-- Enable Row Level Security (RLS)
alter table public.bookmarks enable row level security;

-- Create policies for RLS
create policy "Allow individual select access" on public.bookmarks for select
using (auth.uid() = user_id);

create policy "Allow individual insert access" on public.bookmarks for insert
with check (auth.uid() = user_id);

create policy "Allow individual update access" on public.bookmarks for update
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Allow individual delete access" on public.bookmarks for delete
using (auth.uid() = user_id);

-- Add index on user_id for performance
create index ix_bookmarks_user_id on public.bookmarks (user_id); 