-- Calculator History Table (Best Practice, Extensible)
CREATE TABLE IF NOT EXISTS calculator_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expression TEXT NOT NULL,
    result TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    memory_value NUMERIC,         -- Optional: store memory state per calc
    tags TEXT[],                  -- Optional: categorize calculations
    notes TEXT,                   -- Optional: user notes
    device_id UUID,               -- Optional: for multi-device sync
    deleted_at TIMESTAMP WITH TIME ZONE -- Optional: soft delete
);

-- Index for fast user history lookup
CREATE INDEX IF NOT EXISTS idx_calculator_history_user_id ON calculator_history(user_id);

-- Optional: Index for search/filter by tags
CREATE INDEX IF NOT EXISTS idx_calculator_history_tags ON calculator_history USING GIN (tags);

-- Enable Row Level Security
ALTER TABLE calculator_history ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow users to access their own rows
CREATE POLICY "Users can access their own calculator history"
  ON calculator_history
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
