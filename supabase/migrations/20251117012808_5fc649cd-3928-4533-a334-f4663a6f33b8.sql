-- Fix security warnings by setting search_path on functions
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION increment_preset_usage(preset_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE filter_presets
  SET usage_count = usage_count + 1,
      last_used_at = NOW()
  WHERE id = preset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;