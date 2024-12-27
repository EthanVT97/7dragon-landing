import { supabase, db } from '@/supabase'
import { 
  createChatSession, 
  endChatSession, 
  sendMessage,
  subscribeToChatMessages,
  unsubscribeFromChatMessages
} from '@/utils/chatSession'

export default {
  namespaced: true,

  state: () => ({
    currentSession: null,
    messages: [],
    isLoading: false,
    error: null,
    typingStatus: {},
    messageReactions: {},
    replyThreads: {},
    supportStatus: {
      isOnline: true,
      lastChecked: null
    },
    emergencySupport: {
      active: false,
      type: null,
      timestamp: null
    },
    quickResponses: {}
  }),

  getters: {
    currentMessages: state => state.messages,
    currentSession: state => state.currentSession,
    isLoading: state => state.isLoading,
    error: state => state.error,
    isUserTyping: (state) => (userId) => {
      return state.typingStatus[userId] || false
    },
    getMessageReactions: (state) => (messageId) => {
      return state.messageReactions[messageId] || []
    },
    getMessageReplies: (state) => (messageId) => {
      return state.replyThreads[messageId] || []
    },
    isSupportOnline: state => state.supportStatus.isOnline,
    isEmergencyActive: state => state.emergencySupport.active,
    getEmergencyDetails: state => state.emergencySupport
  },

  mutations: {
    SET_CURRENT_SESSION(state, session) {
      state.currentSession = session
    },

    SET_MESSAGES(state, messages) {
      state.messages = messages
    },

    ADD_MESSAGE(state, message) {
      state.messages.push(message)
    },

    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading
    },

    SET_ERROR(state, error) {
      state.error = error
    },

    SET_TYPING_STATUS(state, { userId, isTyping }) {
      state.typingStatus = {
        ...state.typingStatus,
        [userId]: isTyping
      }
    },
    SET_MESSAGE_REACTIONS(state, { messageId, reactions }) {
      state.messageReactions = {
        ...state.messageReactions,
        [messageId]: reactions
      }
    },
    SET_REPLY_THREAD(state, { messageId, replies }) {
      state.replyThreads = {
        ...state.replyThreads,
        [messageId]: replies
      }
    },
    SET_SUPPORT_STATUS(state, { isOnline, timestamp }) {
      state.supportStatus = {
        isOnline,
        lastChecked: timestamp
      }
    },
    SET_EMERGENCY_SUPPORT(state, { active, type, timestamp }) {
      state.emergencySupport = {
        active,
        type,
        timestamp
      }
    },
    SET_QUICK_RESPONSES(state, responses) {
      state.quickResponses = responses
    }
  },

  actions: {
    async startSession({ commit, dispatch }) {
      try {
        commit('SET_LOADING', true)
        const { session, error } = await createChatSession()
        
        if (error) throw error
        
        commit('SET_CURRENT_SESSION', session)
        
        // Subscribe to realtime updates
        subscribeToChatMessages(session.id, (payload) => {
          if (payload.eventType === 'INSERT') {
            commit('ADD_MESSAGE', payload.new)
          }
        })

        return { success: true, session }
      } catch (error) {
        commit('SET_ERROR', error.message)
        return { success: false, error }
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async endSession({ commit, state }) {
      try {
        if (!state.currentSession) return
        
        commit('SET_LOADING', true)
        const { error } = await endChatSession(state.currentSession.id)
        
        if (error) throw error
        
        // Cleanup subscriptions
        unsubscribeFromChatMessages()
        
        commit('SET_CURRENT_SESSION', null)
        commit('SET_MESSAGES', [])
        
        return { success: true }
      } catch (error) {
        commit('SET_ERROR', error.message)
        return { success: false, error }
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async updateTypingStatus({ commit }, { userId, isTyping }) {
      try {
        const { error } = await supabase
          .from('typing_indicators')
          .upsert({
            user_id: userId,
            message_id: this.state.currentSession?.id,
            is_typing: isTyping,
            updated_at: new Date().toISOString()
          })

        if (error) throw error
        commit('SET_TYPING_STATUS', { userId, isTyping })
      } catch (error) {
        console.error('Error updating typing status:', error)
      }
    },

    async addReaction({ commit, state }, { messageId, emoji }) {
      try {
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            emoji,
            user_id: supabase.auth.user().id
          })

        if (error) throw error

        // Update local state
        const currentReactions = state.messageReactions[messageId] || []
        commit('SET_MESSAGE_REACTIONS', {
          messageId,
          reactions: [...currentReactions, { emoji, user_id: supabase.auth.user().id }]
        })
      } catch (error) {
        console.error('Error adding reaction:', error)
      }
    },

    async removeReaction({ commit, state }, { messageId, emoji }) {
      try {
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .match({
            message_id: messageId,
            emoji,
            user_id: supabase.auth.user().id
          })

        if (error) throw error

        // Update local state
        const currentReactions = state.messageReactions[messageId] || []
        commit('SET_MESSAGE_REACTIONS', {
          messageId,
          reactions: currentReactions.filter(
            r => !(r.emoji === emoji && r.user_id === supabase.auth.user().id)
          )
        })
      } catch (error) {
        console.error('Error removing reaction:', error)
      }
    },

    async addReply({ commit, state }, { messageId, content }) {
      try {
        const { data, error } = await supabase
          .from('message_replies')
          .insert({
            message_id: messageId,
            content,
            user_id: supabase.auth.user().id
          })
          .select('*, user:user_profiles(email)')
          .single()

        if (error) throw error

        // Update local state
        const currentReplies = state.replyThreads[messageId] || []
        commit('SET_REPLY_THREAD', {
          messageId,
          replies: [...currentReplies, data]
        })

        return { success: true, reply: data }
      } catch (error) {
        console.error('Error adding reply:', error)
        return { success: false, error }
      }
    },

    async loadMessageThread({ commit }, messageId) {
      try {
        const { data, error } = await supabase
          .from('message_replies')
          .select(`
            *,
            user:user_profiles(email),
            reactions:message_reactions(*)
          `)
          .eq('message_id', messageId)
          .order('created_at', { ascending: true })

        if (error) throw error

        commit('SET_REPLY_THREAD', { messageId, replies: data })
        return { success: true, replies: data }
      } catch (error) {
        console.error('Error loading message thread:', error)
        return { success: false, error }
      }
    },

    async checkSupportStatus({ commit }) {
      try {
        const response = await fetch('/api/support/status')
        const { online } = await response.json()
        
        commit('SET_SUPPORT_STATUS', {
          isOnline: online,
          timestamp: new Date().toISOString()
        })
        
        return { success: true, online }
      } catch (error) {
        console.error('Failed to check support status:', error)
        return { success: false, error }
      }
    },

    async triggerEmergencySupport({ commit, state }, type = 'urgent') {
      try {
        // Notify support staff
        await supabase
          .from('support_alerts')
          .insert({
            session_id: state.currentSession?.id,
            type,
            status: 'pending',
            priority: 'high'
          })

        // Update local state
        commit('SET_EMERGENCY_SUPPORT', {
          active: true,
          type,
          timestamp: new Date().toISOString()
        })

        // Send system message
        await this.dispatch('chat/sendMessage', {
          content: '🚨 Emergency support has been notified. A support agent will join shortly.',
          type: 'system'
        })

        return { success: true }
      } catch (error) {
        console.error('Failed to trigger emergency support:', error)
        return { success: false, error }
      }
    },

    async triggerSelfExclusion({ dispatch }) {
      return dispatch('triggerEmergencySupport', 'self-exclusion')
    },

    async exportChatTranscript({ state }, format = 'pdf') {
      try {
        const response = await fetch(`/api/chat/export/${format}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: state.currentSession?.id,
            messages: state.messages
          })
        })

        if (!response.ok) throw new Error('Export failed')

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chat-transcript-${new Date().toISOString()}.${format}`
        a.click()

        return { success: true }
      } catch (error) {
        console.error('Failed to export chat transcript:', error)
        return { success: false, error }
      }
    }
  }
}
