import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xnujjoarvinvztccwrye.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudWpqb2Fydmludnp0Y2N3cnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNzc1OTAsImV4cCI6MjA1MDg1MzU5MH0.pyxlMZkDM53RWaPHc4GhsoKdaGDqbkn2p7b1cXF3Wgs';
const supabase = createClient(supabaseUrl, supabaseKey);

// Chat session management
export const createChatSession = async () => {
    const { data, error } = await supabase
        .from('chat_sessions')
        .insert([{ 
            status: 'active',
            created_at: new Date().toISOString()
        }])
        .select()
        .single();
    return { data, error };
};

export const updateChatSession = async (sessionId, status) => {
    const { data, error } = await supabase
        .from('chat_sessions')
        .update({ status })
        .eq('id', sessionId)
        .select()
        .single();
    return { data, error };
};

// Messages functions
export const fetchMessages = async (sessionId) => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
    return { data, error };
};

export const sendMessage = async (content, sender, sessionId) => {
    const { data, error } = await supabase
        .from('messages')
        .insert([{ 
            content, 
            sender,
            session_id: sessionId,
            created_at: new Date().toISOString()
        }])
        .select();
    return { data, error };
};

// Real-time subscriptions
export const subscribeToMessages = (sessionId, callback) => {
    return supabase
        .channel(`messages:${sessionId}`)
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `session_id=eq.${sessionId}`
            }, 
            (payload) => callback(payload.new)
        )
        .subscribe();
};

export const subscribeToSessions = (callback) => {
    return supabase
        .channel('sessions')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'chat_sessions'
            },
            (payload) => callback(payload)
        )
        .subscribe();
};

// Admin functions
export const fetchActiveSessions = async () => {
    const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
            *,
            messages (
                content,
                sender,
                created_at
            )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
    return { data, error };
};

export const assignAdminToSession = async (sessionId, adminId) => {
    const { data, error } = await supabase
        .from('chat_sessions')
        .update({ admin_id: adminId })
        .eq('id', sessionId)
        .select();
    return { data, error };
};

// Admin authentication
export const adminLogin = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    return { data, error };
};

export const adminLogout = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

export default supabase;
