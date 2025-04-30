-- Create the todos table
create table public.todos (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  task text not null check (char_length(task) > 0),
  completed boolean not null default false,
  created_at timestamp with time zone not null default now()
);

-- Add comments to the table and columns
comment on table public.todos is 'Stores user todo list items.';
comment on column public.todos.id is 'Unique identifier for the todo item.';
comment on column public.todos.user_id is 'The user who owns this todo item.';
comment on column public.todos.task is 'The content of the todo task.';
comment on column public.todos.completed is 'Whether the task is completed.';
comment on column public.todos.created_at is 'When the todo item was created.';

-- Enable Row Level Security (RLS)
alter table public.todos enable row level security;

-- Create policies for RLS
-- Policy: Allow users to SELECT their own todos
create policy "Allow individual select access"
on public.todos for select
using (auth.uid() = user_id);

-- Policy: Allow users to INSERT todos for themselves
create policy "Allow individual insert access"
on public.todos for insert
with check (auth.uid() = user_id);

-- Policy: Allow users to UPDATE their own todos
create policy "Allow individual update access"
on public.todos for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policy: Allow users to DELETE their own todos
create policy "Allow individual delete access"
on public.todos for delete
using (auth.uid() = user_id);

-- Optional: Add indexes for performance, especially on user_id
create index ix_todos_user_id on public.todos (user_id);
