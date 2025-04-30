-- Unified Music Tables Migration

-- Playlists table
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraint for queue playlist
create unique index if not exists playlists_user_id_name_idx on public.playlists(user_id, name);

-- Playlist songs table
create table if not exists public.playlist_songs (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  song_id text not null, -- YouTube video ID
  title text not null,
  url text not null,
  seq_id int not null, -- Order in playlist
  added_at timestamptz not null default now()
  -- unique (playlist_id, song_id) -- Removed to allow duplicates
);

-- Index for fast lookup
create index if not exists idx_playlist_songs_playlist_id on public.playlist_songs(playlist_id);

-- Trigger to update updated_at on playlists when songs change
create or replace function update_playlist_updated_at()
returns trigger as $$
begin
  update public.playlists set updated_at = now() where id = NEW.playlist_id;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists playlist_songs_update_playlist_updated_at on public.playlist_songs;
create trigger playlist_songs_update_playlist_updated_at
after insert or update or delete on public.playlist_songs
for each row execute procedure update_playlist_updated_at();

-- Music songs table (for global/user songs)
create table if not exists public.music_songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id), -- nullable for global songs
  title text not null,
  url text not null,
  seq_id integer not null,
  created_at timestamptz not null default now()
);

-- Insert a few global default songs (user_id is NULL)
insert into public.music_songs (title, url, seq_id)
values
  ('Ghibli Melody', 'https://www.youtube.com/watch?v=Fp5ghKduTK8', 1),
  ('Harukaze - Rihwa', 'https://www.youtube.com/watch?v=rrFlMNT4blk', 2),
  ('One Summer''s Day - Joe Hisaishi', 'https://www.youtube.com/watch?v=TK1Ij_-mank', 3),
  ('Path of the Wind - Totoro OST', 'https://www.youtube.com/watch?v=MZgBjQFMPvk', 4),
  ('Kimi wo Nosete - Laputa OST', 'https://www.youtube.com/watch?v=C-jzcf5JrJU', 5)
  on conflict do nothing; 