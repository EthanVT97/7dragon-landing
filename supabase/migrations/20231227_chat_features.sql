-- Add reactions support
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction)
);

-- Add file attachments support
CREATE TABLE IF NOT EXISTS public.message_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add typing indicators
CREATE TABLE IF NOT EXISTS public.typing_indicators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_typed TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, recipient_id)
);

-- Update messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES public.messages(id);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Policies for reactions
CREATE POLICY "Users can view reactions"
    ON public.message_reactions
    FOR SELECT
    USING (true);

CREATE POLICY "Users can add reactions"
    ON public.message_reactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions"
    ON public.message_reactions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for attachments
CREATE POLICY "Users can view attachments"
    ON public.message_attachments
    FOR SELECT
    USING (true);

CREATE POLICY "Users can add attachments"
    ON public.message_attachments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.messages
            WHERE id = message_id
            AND user_id = auth.uid()
        )
    );

-- Policies for typing indicators
CREATE POLICY "Users can view typing indicators"
    ON public.typing_indicators
    FOR SELECT
    USING (auth.uid() = recipient_id);

CREATE POLICY "Users can manage their typing status"
    ON public.typing_indicators
    FOR ALL
    USING (auth.uid() = user_id);

-- Add functions for typing indicators
CREATE OR REPLACE FUNCTION handle_typing_indicator()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete typing indicator after 3 seconds
    DELETE FROM public.typing_indicators
    WHERE user_id = NEW.user_id
    AND recipient_id = NEW.recipient_id
    AND last_typed < NOW() - INTERVAL '3 seconds';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for typing cleanup
CREATE TRIGGER cleanup_typing_indicators
    AFTER INSERT ON public.typing_indicators
    FOR EACH ROW
    EXECUTE FUNCTION handle_typing_indicator();

-- Add realtime
ALTER PUBLICATION supabase_realtime 
ADD TABLE message_reactions,
ADD TABLE message_attachments,
ADD TABLE typing_indicators;
