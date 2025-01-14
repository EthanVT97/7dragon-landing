import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xnujjoarvinvztccwrye.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudWpqb2Fydmludnp0Y2N3cnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNzc1OTAsImV4cCI6MjA1MDg1MzU5MH0.pyxlMZkDM53RWaPHc4GhsoKdaGDqbkn2p7b1cXF3Wgs';
const supabase = createClient(supabaseUrl, supabaseKey);

// Messages functions
export const fetchMessages = async () => {
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
    return { data, error };
};

export const sendMessage = async (content, sender) => {
    const { data, error } = await supabase
        .from("messages")
        .insert([{ content, sender }])
        .select();
    return { data, error };
};

// Real-time subscription
export const subscribeToMessages = (callback) => {
    return supabase
        .channel("realtime:messages")
        .on("postgres_changes", 
            { event: "INSERT", schema: "public", table: "messages" }, 
            (payload) => callback(payload.new)
        )
        .subscribe();
};

// Admin functions
export const fetchAdminMessages = async () => {
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq('sender', 'admin')
        .order("created_at", { ascending: true });
    return { data, error };
};

export const sendAdminMessage = async (content) => {
    const { data, error } = await supabase
        .from("messages")
        .insert([{ content, sender: 'admin' }])
        .select();
    return { data, error };
};

// Chatbot configuration functions
export const getChatbotConfig = async () => {
    const { data, error } = await supabase
        .from('chatbot_config')
        .select('*');
    return { data, error };
};

export const processBotResponse = async (userMessage) => {
    // Get chatbot configurations
    const { data: configs } = await getChatbotConfig();
    let botResponse = "I'm sorry, I don't understand. How can I help you?";

    if (configs) {
        for (const config of configs) {
            if (userMessage.toLowerCase().includes(config.keyword.toLowerCase())) {
                botResponse = config.response;
                break;
            }
        }
    }

    // Send bot response
    return sendMessage(botResponse, 'bot');
};

export default supabase;
