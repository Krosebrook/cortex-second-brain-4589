-- Add columns for preset management
ALTER TABLE filter_presets
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_filter_presets_sort ON filter_presets(user_id, scope, sort_order);

-- Add version columns for optimistic locking
ALTER TABLE knowledge_base
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE chats
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create function to auto-increment version on update
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for version auto-increment
DROP TRIGGER IF EXISTS knowledge_version_trigger ON knowledge_base;
CREATE TRIGGER knowledge_version_trigger
BEFORE UPDATE ON knowledge_base
FOR EACH ROW
EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS chats_version_trigger ON chats;
CREATE TRIGGER chats_version_trigger
BEFORE UPDATE ON chats
FOR EACH ROW
EXECUTE FUNCTION increment_version();

-- Function to increment preset usage
CREATE OR REPLACE FUNCTION increment_preset_usage(preset_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE filter_presets
  SET usage_count = usage_count + 1,
      last_used_at = NOW()
  WHERE id = preset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;