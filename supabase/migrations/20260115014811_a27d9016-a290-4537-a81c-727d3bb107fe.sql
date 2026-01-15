-- ============================================
-- Notifications System Database Setup
-- ============================================

-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'info', 'success', 'warning', 'error', 
  'mention', 'comment', 'share', 'system', 'security'
);

-- Create notification category enum
CREATE TYPE notification_category AS ENUM (
  'general', 'chat', 'knowledge', 'project', 
  'design', 'security', 'billing', 'collaboration'
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'info',
  category notification_category DEFAULT 'general',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Block anonymous access
CREATE POLICY "Block anonymous access to notifications"
  ON notifications FOR SELECT
  TO anon
  USING (false);

-- ============================================
-- User Goals Table
-- ============================================

CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  target_value INTEGER NOT NULL DEFAULT 100,
  current_value INTEGER DEFAULT 0,
  goal_type TEXT NOT NULL, -- 'imports', 'searches', 'cortexes'
  period TEXT DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for user_goals
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);

-- Enable RLS
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_goals
CREATE POLICY "Users can view their own goals"
  ON user_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
  ON user_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON user_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON user_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Block anonymous access
CREATE POLICY "Block anonymous access to user_goals"
  ON user_goals FOR SELECT
  TO anon
  USING (false);

-- ============================================
-- Helper Functions
-- ============================================

-- Mark single notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = now()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$;

-- Mark all notifications as read for current user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = now()
  WHERE user_id = auth.uid() AND is_read = false;
END;
$$;

-- Get unread notification count for current user
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM notifications
  WHERE user_id = auth.uid() AND is_read = false;
$$;

-- Create notification helper (for triggers and edge functions)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type notification_type DEFAULT 'info',
  p_category notification_category DEFAULT 'general',
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, category, action_url, metadata)
  VALUES (p_user_id, p_title, p_message, p_type, p_category, p_action_url, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- ============================================
-- Triggers for automatic notifications
-- ============================================

-- Trigger function to create notification on knowledge_base insert
CREATE OR REPLACE FUNCTION notify_on_knowledge_base_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_notification(
    NEW.user_id,
    'Content Imported',
    'Successfully imported: ' || LEFT(NEW.title, 50),
    'success'::notification_type,
    'knowledge'::notification_category,
    '/manage',
    jsonb_build_object('knowledge_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER knowledge_base_insert_notification
  AFTER INSERT ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_knowledge_base_insert();

-- Trigger function for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to user_goals
CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();