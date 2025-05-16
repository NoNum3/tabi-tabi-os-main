-- Bookmarks & Folders Tables (Best Practice, Extensible)

-- Bookmark Folders Table (clear, specific)
CREATE TABLE IF NOT EXISTS bookmark_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES bookmark_folders(id) ON DELETE SET NULL, -- For nested folders
    sort_order INTEGER DEFAULT 0, -- For custom ordering and drag-and-drop
    symbol TEXT, -- Emoji or symbol for folder
    color TEXT,  -- Color hex or name for folder
    is_pinned BOOLEAN DEFAULT FALSE, -- Pin folders to top
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_bookmark_folders_user_id ON bookmark_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_folders_parent_id ON bookmark_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_folders_sort_order ON bookmark_folders(sort_order);
CREATE INDEX IF NOT EXISTS idx_bookmark_folders_name ON bookmark_folders(name);

-- Bookmarks Table
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tags TEXT[],
    folder_id UUID REFERENCES bookmark_folders(id) ON DELETE SET NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE, -- Pin bookmarks to top
    symbol TEXT, -- Emoji or symbol for bookmark
    color TEXT,  -- Color hex or name for bookmark
    visit_count INTEGER DEFAULT 0,
    last_visited_at TIMESTAMP WITH TIME ZONE,
    custom_metadata JSONB,
    sort_order INTEGER DEFAULT 0, -- For custom ordering
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags ON bookmarks USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_bookmarks_folder_id ON bookmarks(folder_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_is_favorite ON bookmarks(is_favorite);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at);
CREATE INDEX IF NOT EXISTS idx_bookmarks_sort_order ON bookmarks(sort_order);
CREATE INDEX IF NOT EXISTS idx_bookmarks_title ON bookmarks(title);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_folders ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow users to access their own bookmarks
CREATE POLICY "Users can access their own bookmarks"
  ON bookmarks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Only allow users to access their own bookmark folders
CREATE POLICY "Users can access their own bookmark folders"
  ON bookmark_folders
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
