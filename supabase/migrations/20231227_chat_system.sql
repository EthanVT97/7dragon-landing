-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create storage buckets for files and images
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('chat-images', 'chat-images', true),
  ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for images and files
CREATE POLICY "Images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Repeat policies for files bucket
CREATE POLICY "Files are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-files');

CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-files' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-files' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'user', 'guest');
CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'system', 'error');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read', 'error');

-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user'::user_role,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create chat sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    last_message_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    message_type message_type DEFAULT 'text'::message_type,
    content TEXT,
    image_url TEXT,
    file_url TEXT,
    file_type TEXT,
    file_name TEXT,
    file_size INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    status message_status DEFAULT 'sent'::message_status,
    is_bot_message BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    parent_message_id UUID REFERENCES public.chat_messages(id)
);

-- Create message reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(message_id, user_id, emoji)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON public.chat_sessions(updated_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_parent ON public.chat_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- User Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Chat Sessions Policies
CREATE POLICY "Users can view their own chat sessions"
    ON public.chat_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions"
    ON public.chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
    ON public.chat_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Chat Messages Policies
CREATE POLICY "Users can view messages in their sessions"
    ON public.chat_messages FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.chat_sessions 
            WHERE id = chat_messages.session_id
        )
    );

CREATE POLICY "Users can create messages in their sessions"
    ON public.chat_messages FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.chat_sessions 
            WHERE id = session_id
        )
    );

CREATE POLICY "Users can update their own messages"
    ON public.chat_messages FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Message Reactions Policies
CREATE POLICY "Users can view message reactions"
    ON public.message_reactions FOR SELECT
    USING (true);

CREATE POLICY "Users can create reactions"
    ON public.message_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
    ON public.message_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- Create Functions

-- Function to get chat history
CREATE OR REPLACE FUNCTION get_chat_history(
    p_session_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    message_type message_type,
    content TEXT,
    image_url TEXT,
    file_url TEXT,
    file_name TEXT,
    status message_status,
    is_bot_message BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    user_profile JSONB,
    reactions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.user_id,
        m.message_type,
        m.content,
        m.image_url,
        m.file_url,
        m.file_name,
        m.status,
        m.is_bot_message,
        m.created_at,
        jsonb_build_object(
            'username', p.username,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ) as user_profile,
        COALESCE(
            jsonb_agg(
                DISTINCT jsonb_build_object(
                    'emoji', r.emoji,
                    'count', COUNT(*) OVER (PARTITION BY r.emoji)
                )
            ) FILTER (WHERE r.emoji IS NOT NULL),
            '[]'::jsonb
        ) as reactions
    FROM public.chat_messages m
    LEFT JOIN public.user_profiles p ON m.user_id = p.id
    LEFT JOIN public.message_reactions r ON m.id = r.message_id
    WHERE m.session_id = p_session_id
    GROUP BY 
        m.id, m.user_id, m.message_type, m.content, 
        m.image_url, m.file_url, m.file_name, m.status,
        m.is_bot_message, m.created_at, p.username, 
        p.full_name, p.avatar_url
    ORDER BY m.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function to create a new chat session
CREATE OR REPLACE FUNCTION create_chat_session(
    p_user_id UUID,
    p_title TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
BEGIN
    INSERT INTO public.chat_sessions (user_id, title)
    VALUES (p_user_id, COALESCE(p_title, 'New Chat'))
    RETURNING id INTO v_session_id;
    
    RETURN v_session_id;
END;
$$;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_session_id UUID,
    p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.chat_messages
    SET 
        status = 'read'::message_status,
        read_at = NOW(),
        updated_at = NOW()
    WHERE 
        session_id = p_session_id
        AND user_id != p_user_id
        AND status != 'read'::message_status;
END;
$$;

-- Trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update last_message_at in chat_sessions
CREATE OR REPLACE FUNCTION update_session_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chat_sessions
    SET 
        last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_last_message_trigger
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_session_last_message();
