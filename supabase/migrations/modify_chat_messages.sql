-- Drop existing chat_messages table if it exists
DROP TABLE IF EXISTS chat_messages CASCADE;

-- Create modified chat_messages table with image support
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'error')),
    content TEXT,  -- For text messages
    image_url TEXT, -- For image messages
    file_url TEXT,  -- For file attachments
    file_type TEXT, -- MIME type for files
    file_name TEXT, -- Original file name
    file_size INTEGER, -- Size in bytes
    response TEXT,
    response_type TEXT DEFAULT 'text' CHECK (response_type IN ('text', 'image', 'file', 'error')),
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
    processed_at TIMESTAMP WITH TIME ZONE, -- When the message was processed
    metadata JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'processing', 'completed', 'error')),
    error_message TEXT,
    -- Add constraints
    CONSTRAINT content_required CHECK (
        (message_type = 'text' AND content IS NOT NULL) OR
        (message_type = 'image' AND image_url IS NOT NULL) OR
        (message_type = 'file' AND file_url IS NOT NULL) OR
        (message_type = 'system' AND content IS NOT NULL) OR
        (message_type = 'error' AND error_message IS NOT NULL)
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON chat_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON chat_messages(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat messages
CREATE POLICY "Users can view their own messages"
    ON chat_messages FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages"
    ON chat_messages FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all messages"
    ON chat_messages FOR SELECT
    TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Function to get chat history with images
CREATE OR REPLACE FUNCTION get_chat_history(
    p_session_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    message_type TEXT,
    content TEXT,
    image_url TEXT,
    file_url TEXT,
    file_name TEXT,
    response TEXT,
    response_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.user_id,
        cm.message_type,
        cm.content,
        cm.image_url,
        cm.file_url,
        cm.file_name,
        cm.response,
        cm.response_type,
        cm.created_at,
        cm.status
    FROM chat_messages cm
    WHERE cm.session_id = p_session_id
    ORDER BY cm.created_at ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to get message statistics including images
CREATE OR REPLACE FUNCTION get_message_statistics(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() - INTERVAL '30 days'),
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_messages BIGINT,
    text_messages BIGINT,
    image_messages BIGINT,
    file_messages BIGINT,
    avg_response_time FLOAT,
    success_rate FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_messages,
        COUNT(CASE WHEN message_type = 'text' THEN 1 END) as text_messages,
        COUNT(CASE WHEN message_type = 'image' THEN 1 END) as image_messages,
        COUNT(CASE WHEN message_type = 'file' THEN 1 END) as file_messages,
        AVG(EXTRACT(EPOCH FROM (processed_at - created_at)))::FLOAT as avg_response_time,
        (COUNT(CASE WHEN status = 'completed' THEN 1 END)::FLOAT / 
         NULLIF(COUNT(*)::FLOAT, 0) * 100) as success_rate
    FROM chat_messages
    WHERE created_at BETWEEN start_date AND end_date;
END;
$$;
