-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create base tables
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    nickname TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(username)
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text',
    status TEXT NOT NULL DEFAULT 'sent',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin features tables
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS message_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON admin_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_replies_message ON message_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_typing_message ON typing_indicators(message_id);

-- Add text search capabilities to chat messages
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS chat_messages_search_idx ON chat_messages USING GIN(search_vector);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION chat_messages_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'A');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger to update search vector
DROP TRIGGER IF EXISTS chat_messages_search_trigger ON chat_messages;
CREATE TRIGGER chat_messages_search_trigger
  BEFORE INSERT OR UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION chat_messages_search_update();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow new user creation" ON user_profiles;

DROP POLICY IF EXISTS "Users can view their own sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON chat_sessions;

DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;

DROP POLICY IF EXISTS "Allow admins to view all notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Allow admins to update notifications" ON admin_notifications;

DROP POLICY IF EXISTS "Allow authenticated users to add reactions" ON message_reactions;
DROP POLICY IF EXISTS "Allow users to remove their own reactions" ON message_reactions;
DROP POLICY IF EXISTS "Allow everyone to view reactions" ON message_reactions;

DROP POLICY IF EXISTS "Allow authenticated users to add replies" ON message_replies;
DROP POLICY IF EXISTS "Allow users to update their own replies" ON message_replies;
DROP POLICY IF EXISTS "Allow users to delete their own replies" ON message_replies;
DROP POLICY IF EXISTS "Allow everyone to view replies" ON message_replies;

DROP POLICY IF EXISTS "Allow authenticated users to update typing status" ON typing_indicators;

-- User profiles policies
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Allow new user creation"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Chat sessions policies
CREATE POLICY "Users can view their own sessions"
    ON chat_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create sessions"
    ON chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
    ON chat_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
    ON chat_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view their own messages"
    ON chat_messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert messages"
    ON chat_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
    ON chat_messages FOR UPDATE
    USING (auth.uid() = user_id);

-- Admin notifications policies
CREATE POLICY "Allow admins to view all notifications"
    ON admin_notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Allow admins to update notifications"
    ON admin_notifications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Message reactions policies
CREATE POLICY "Allow authenticated users to add reactions"
    ON message_reactions FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to remove their own reactions"
    ON message_reactions FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Allow everyone to view reactions"
    ON message_reactions FOR SELECT
    USING (true);

-- Message replies policies
CREATE POLICY "Allow authenticated users to add replies"
    ON message_replies FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update their own replies"
    ON message_replies FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own replies"
    ON message_replies FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Allow everyone to view replies"
    ON message_replies FOR SELECT
    USING (true);

-- Typing indicators policies
CREATE POLICY "Allow authenticated users to update typing status"
    ON typing_indicators FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to create admin notification
CREATE OR REPLACE FUNCTION create_admin_notification(
    p_type TEXT,
    p_message TEXT,
    p_action_url TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO admin_notifications (type, message, action_url, user_id)
    SELECT p_type, p_message, p_action_url, user_profiles.user_id
    FROM user_profiles
    WHERE user_profiles.role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user display name
CREATE OR REPLACE FUNCTION get_user_display_name(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    display_name TEXT;
BEGIN
    SELECT COALESCE(nickname, username, 'Anonymous')
    INTO display_name
    FROM user_profiles
    WHERE user_profiles.user_id = $1;
    
    RETURN display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate nickname
CREATE OR REPLACE FUNCTION validate_nickname(nickname TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN 
        nickname IS NOT NULL 
        AND LENGTH(nickname) BETWEEN 2 AND 30
        AND nickname ~ '^[a-zA-Z0-9\s\-_!@#$%^&*()+=]{2,30}$';
END;
$$ LANGUAGE plpgsql;