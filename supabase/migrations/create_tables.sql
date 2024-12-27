-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Content Table
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'))
);

-- Chatbot Settings Table
CREATE TABLE IF NOT EXISTS chatbot_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    model_settings JSONB DEFAULT '{}'::jsonb,
    prompt_template TEXT,
    max_tokens INTEGER DEFAULT 2048,
    temperature FLOAT DEFAULT 0.7,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
    updated_by UUID REFERENCES auth.users(id)
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    message TEXT NOT NULL,
    response TEXT,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
    metadata JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'processing', 'completed', 'error')),
    error_message TEXT
);

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    session_id UUID,
    event_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now())
);

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
    ended_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for content
CREATE POLICY "Content viewable by all users"
    ON content FOR SELECT
    USING (status = 'published' OR auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Content editable by admins only"
    ON content FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM admin_users))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));

-- Create policies for chatbot settings
CREATE POLICY "Chatbot settings viewable by all users"
    ON chatbot_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Chatbot settings editable by admins only"
    ON chatbot_settings FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM admin_users))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));

-- Create policies for chat messages
CREATE POLICY "Users can view their own messages"
    ON chat_messages FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages"
    ON chat_messages FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create policies for analytics
CREATE POLICY "Analytics viewable by admins only"
    ON analytics_events FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Analytics insertable by authenticated users"
    ON analytics_events FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policies for chat sessions
CREATE POLICY "Users can view their own sessions"
    ON chat_sessions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
    ON chat_sessions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);

-- Create functions for analytics
CREATE OR REPLACE FUNCTION get_chat_statistics(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() - INTERVAL '30 days'),
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_chats BIGINT,
    total_users BIGINT,
    avg_response_time FLOAT,
    success_rate FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT cm.session_id) as total_chats,
        COUNT(DISTINCT cm.user_id) as total_users,
        AVG(EXTRACT(EPOCH FROM (
            LEAD(cm.created_at) OVER (PARTITION BY cm.session_id ORDER BY cm.created_at) - cm.created_at
        )))::FLOAT as avg_response_time,
        (COUNT(CASE WHEN cm.status = 'completed' THEN 1 END)::FLOAT / 
         COUNT(*)::FLOAT * 100) as success_rate
    FROM chat_messages cm
    WHERE cm.created_at BETWEEN start_date AND end_date;
END;
$$;
