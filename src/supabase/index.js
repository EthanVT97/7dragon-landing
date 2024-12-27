import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xnujjoarvinvztccwrye.supabase.co';
const supabaseKey = process.env.VUE_APP_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Message functions
export const sendMessage = async ({ content, sessionId, senderType, messageType = 'text', fileUrl = null }) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      content,
      session_id: sessionId,
      sender_type: senderType,
      message_type: messageType,
      file_url: fileUrl,
      status: 'sent'
    }])
    .select();
  return { data, error };
};

export const fetchSessionMessages = async (sessionId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  return { data, error };
};

export const subscribeToSessionMessages = (sessionId, callback) => {
  return supabase
    .from(`messages:session_id=eq.${sessionId}`)
    .on('INSERT', payload => callback(payload.new))
    .on('UPDATE', payload => callback(payload.new))
    .subscribe();
};

// Chat session functions
export const createChatSession = async (userId, metadata = {}) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert([{
      user_id: userId,
      status: 'active',
      metadata
    }])
    .select();
  return { data, error };
};

export const updateSessionStatus = async (sessionId, status) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .update({ status })
    .eq('id', sessionId)
    .select();
  return { data, error };
};

// Admin functions
export const fetchAllSessions = async () => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select(`
      *,
      messages:messages(count),
      user:users(*)
    `)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const subscribeToNewSessions = (callback) => {
  return supabase
    .from('chat_sessions')
    .on('INSERT', payload => callback(payload.new))
    .on('UPDATE', payload => callback(payload.new))
    .subscribe();
};

export const markMessageAsRead = async (messageId) => {
  const { data, error } = await supabase
    .from('messages')
    .update({ status: 'read' })
    .eq('id', messageId)
    .select();
  return { data, error };
};

// User management
export const updateUserRole = async (userId, role) => {
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select();
  return { data, error };
};

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export default supabase;
