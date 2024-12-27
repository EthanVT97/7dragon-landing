import { supabase } from '../supabase/index.js'
import { getUserDisplayName } from './userProfile.js'

/**
 * Create a new chat session
 * @param {Object} params - Parameters for creating a chat session
 * @param {string} params.userId - User ID
 * @param {string} [params.title] - Optional chat session title
 * @returns {Promise<Object>} - Created chat session or error
 */
export const createChatSession = async ({ userId, title = null }) => {
  try {
    // Get user profile first
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('username, nickname')
      .eq('user_id', userId)
      .single()

    if (profileError) throw profileError

    const displayName = getUserDisplayName(userProfile)

    // Create chat session
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: title || `Chat with ${displayName}`,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      session: data
    }
  } catch (error) {
    console.error('Error creating chat session:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get chat history for a session
 * @param {string} sessionId - The session ID
 * @param {Object} options - Options for pagination
 * @param {number} [options.limit=50] - Number of messages to fetch
 * @param {number} [options.offset=0] - Offset for pagination
 * @returns {Promise<{ data: Array<Message> | null, error: Error | null }>}
 */
export async function getChatHistory(sessionId, { limit = 50, offset = 0 } = {}) {
  try {
    const { data, error } = await supabase
      .rpc('get_chat_history', {
        p_session_id: sessionId,
        p_limit: limit,
        p_offset: offset
      })

    if (error) throw error

    // Transform timestamps to Date objects
    const messages = data.map(message => ({
      ...message,
      created_at: new Date(message.created_at),
      read_at: message.read_at ? new Date(message.read_at) : null
    }))

    return { data: messages, error: null }
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return { data: null, error }
  }
}

/**
 * Mark all messages in a session as read
 * @param {string} sessionId - The session ID
 * @param {string} userId - The user's ID
 * @returns {Promise<{ success: boolean, error: Error | null }>}
 */
export async function markMessagesAsRead(sessionId, userId) {
  try {
    const { error } = await supabase
      .rpc('mark_messages_as_read', {
        p_session_id: sessionId,
        p_user_id: userId
      })

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return { success: false, error }
  }
}

/**
 * Get all chat sessions for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<{ data: Array<Session> | null, error: Error | null }>}
 */
export async function getUserChatSessions(userId) {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(`
        *,
        last_message:chat_messages(
          content,
          message_type,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })
      .limit(1)

    if (error) throw error

    // Transform timestamps and format last message
    const sessions = data.map(session => ({
      ...session,
      created_at: new Date(session.created_at),
      updated_at: new Date(session.updated_at),
      last_message_at: session.last_message_at ? new Date(session.last_message_at) : null,
      last_message: session.last_message?.[0] ? {
        ...session.last_message[0],
        created_at: new Date(session.last_message[0].created_at)
      } : null
    }))

    return { data: sessions, error: null }
  } catch (error) {
    console.error('Error fetching user chat sessions:', error)
    return { data: null, error }
  }
}

/**
 * Delete a chat session and all its messages
 * @param {string} sessionId - The session ID
 * @param {string} userId - The user's ID
 * @returns {Promise<{ success: boolean, error: Error | null }>}
 */
export async function deleteChatSession(sessionId, userId) {
  try {
    // First verify the user owns this session
    const { data: session, error: fetchError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !session) {
      throw new Error('Session not found or access denied')
    }

    // Delete the session (messages will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)

    if (deleteError) throw deleteError

    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting chat session:', error)
    return { success: false, error }
  }
}

/**
 * Update a chat session's title
 * @param {string} sessionId - The session ID
 * @param {string} userId - The user's ID
 * @param {string} title - The new title
 * @returns {Promise<{ success: boolean, error: Error | null }>}
 */
export async function updateChatSessionTitle(sessionId, userId, title) {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title })
      .eq('id', sessionId)
      .eq('user_id', userId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating chat session title:', error)
    return { success: false, error }
  }
}

// Add realtime subscription for chat messages
let messageSubscription = null

export const subscribeToChatMessages = (sessionId, callback) => {
  if (messageSubscription) {
    supabase.removeChannel(messageSubscription)
  }

  messageSubscription = helpers.subscribeToRecord('chat_messages', sessionId, (payload) => {
    callback(payload)
  })

  return messageSubscription
}

export const unsubscribeFromChatMessages = () => {
  if (messageSubscription) {
    supabase.removeChannel(messageSubscription)
    messageSubscription = null
  }
}
