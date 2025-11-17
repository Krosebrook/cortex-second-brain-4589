-- Migration 1: Add soft deletes for undo/redo functionality
ALTER TABLE knowledge_base 
ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;

ALTER TABLE chats
ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;

-- Create indexes for efficient filtering
CREATE INDEX idx_knowledge_deleted ON knowledge_base(user_id, deleted_at);
CREATE INDEX idx_chats_deleted ON chats(user_id, deleted_at);

-- Migration 2: Create filter_presets table
CREATE TABLE filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('knowledge', 'chats')),
  is_default BOOLEAN DEFAULT false,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create unique constraint for default preset per scope
CREATE UNIQUE INDEX unique_default_per_scope 
ON filter_presets(user_id, scope) 
WHERE is_default = true;

CREATE INDEX idx_filter_presets_user_scope ON filter_presets(user_id, scope);

-- RLS Policies for filter_presets
ALTER TABLE filter_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own presets"
  ON filter_presets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presets"
  ON filter_presets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presets"
  ON filter_presets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presets"
  ON filter_presets FOR DELETE
  USING (auth.uid() = user_id);