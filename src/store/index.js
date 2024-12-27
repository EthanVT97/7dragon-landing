import { createStore } from 'vuex'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
const supabaseKey = process.env.VUE_APP_SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default createStore({
  state: {
    user: null,
    isDarkMode: true,
    currentLanguage: 'my',
    messages: [],
    isConnected: false,
    unreadMessages: 0
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user
    },
    SET_DARK_MODE(state, isDark) {
      state.isDarkMode = isDark
    },
    SET_LANGUAGE(state, lang) {
      state.currentLanguage = lang
      localStorage.setItem('preferredLanguage', lang)
    },
    ADD_MESSAGE(state, message) {
      state.messages.push(message)
      if (!message.isFromUser && !document.hasFocus()) {
        state.unreadMessages++
      }
    },
    CLEAR_MESSAGES(state) {
      state.messages = []
    },
    SET_CONNECTION_STATUS(state, status) {
      state.isConnected = status
    },
    RESET_UNREAD(state) {
      state.unreadMessages = 0
    }
  },
  actions: {
    async login({ commit }, { email, password }) {
      try {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error
        
        commit('SET_USER', user)
        return { user }
      } catch (error) {
        return { error }
      }
    },
    
    async logout({ commit }) {
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        
        commit('SET_USER', null)
        commit('CLEAR_MESSAGES')
        return { success: true }
      } catch (error) {
        return { error }
      }
    },
    
    async sendMessage({ commit, state }, content) {
      try {
        if (!state.isConnected) {
          throw new Error('Not connected to chat service')
        }
        
        const message = {
          content,
          timestamp: new Date(),
          isFromUser: true,
          status: 'sent'
        }
        
        commit('ADD_MESSAGE', message)
        
        // Send to Supabase
        const { error } = await supabase
          .from('messages')
          .insert([{
            content: content,
            user_id: state.user?.id,
            is_from_user: true
          }])
        
        if (error) throw error
        
        return { success: true }
      } catch (error) {
        return { error }
      }
    },
    
    setLanguage({ commit }, lang) {
      commit('SET_LANGUAGE', lang)
    },
    
    toggleDarkMode({ commit, state }) {
      commit('SET_DARK_MODE', !state.isDarkMode)
    },
    
    setConnectionStatus({ commit }, status) {
      commit('SET_CONNECTION_STATUS', status)
    },
    
    resetUnreadCount({ commit }) {
      commit('RESET_UNREAD')
    }
  },
  getters: {
    isAuthenticated: state => !!state.user,
    currentUser: state => state.user,
    messageHistory: state => state.messages,
    unreadCount: state => state.unreadMessages,
    isDark: state => state.isDarkMode,
    language: state => state.currentLanguage
  }
})
