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
    },
    INCREMENT_UNREAD(state) {
      state.unreadMessages++
    },
    UPDATE_MESSAGE_STATUS(state, { timestamp, status, id }) {
      const messageIndex = state.messages.findIndex(message => message.timestamp.getTime() === timestamp.getTime())
      if (messageIndex !== -1) {
        state.messages[messageIndex].status = status
        if (id) {
          state.messages[messageIndex].id = id
        }
      }
    }
  },
  actions: {
    async createAdminUser(context, { username, password, email, role = 'admin' }) {
      try {
        // First, create the auth user
        const { data: { user }, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              role
            }
          }
        })

        if (authError) throw authError

        // Then, insert the admin details into our custom table
        const { error: profileError } = await supabase
          .from('admin_users')
          .insert([
            {
              user_id: user.id,
              username,
              email,
              role,
              created_at: new Date().toISOString()
            }
          ])

        if (profileError) throw profileError

        return { user }
      } catch (error) {
        console.error('Error creating admin user:', error)
        return { error }
      }
    },

    async getAdminUsers() {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        return { data }
      } catch (error) {
        console.error('Error fetching admin users:', error)
        return { error }
      }
    },

    async updateAdminUser(context, { userId, updates }) {
      try {
        const { error } = await supabase
          .from('admin_users')
          .update(updates)
          .eq('user_id', userId)

        if (error) throw error

        return { success: true }
      } catch (error) {
        console.error('Error updating admin user:', error)
        return { error }
      }
    },

    async deleteAdminUser(context, userId) {
      try {
        // Delete from admin_users table
        const { error: profileError } = await supabase
          .from('admin_users')
          .delete()
          .eq('user_id', userId)

        if (profileError) throw profileError

        // Optionally delete the auth user as well
        const { error: authError } = await supabase.auth.admin.deleteUser(userId)

        if (authError) throw authError

        return { success: true }
      } catch (error) {
        console.error('Error deleting admin user:', error)
        return { error }
      }
    },

    async testConnection({ commit }) {
      try {
        const { error } = await supabase
          .from('messages')
          .select('count')
          .limit(1)
        
        if (error) {
          console.error('Supabase connection error:', error.message)
          commit('SET_CONNECTION_STATUS', false)
          return { error }
        }
        
        console.log('Supabase connection successful')
        commit('SET_CONNECTION_STATUS', true)
        return { success: true }
      } catch (error) {
        console.error('Supabase connection error:', error)
        commit('SET_CONNECTION_STATUS', false)
        return { error }
      }
    },
    
    async login({ commit }, { email, password }) {
      try {
        // Sign in with email and password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error

        // Get user role from profiles table with error handling
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('role, username')
          .eq('id', data.user.id)
          .limit(1)

        if (profileError) {
          console.error('Profile fetch error:', profileError)
          throw new Error('Failed to fetch user profile')
        }

        if (!profiles || profiles.length === 0) {
          throw new Error('User profile not found')
        }

        // Set user with role information
        const userWithProfile = {
          ...data.user,
          role: profiles[0].role,
          username: profiles[0].username
        }
        
        commit('SET_USER', userWithProfile)
        return { user: userWithProfile }
      } catch (error) {
        console.error('Login error:', error)
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

        // Create message object
        const message = {
          content,
          timestamp: new Date(),
          isFromUser: true,
          status: 'sending'
        }

        // Add to local state
        commit('ADD_MESSAGE', message)

        // Send to Supabase
        const { data, error } = await supabase
          .from('messages')
          .insert([{
            content: content,
            user_id: state.user.id,
            is_from_user: true,
            session_id: state.user.session_id || null
          }])
          .select()
          .single()

        if (error) throw error

        // Update message status
        commit('UPDATE_MESSAGE_STATUS', {
          timestamp: message.timestamp,
          status: 'sent',
          id: data.id
        })

        return { success: true }
      } catch (error) {
        console.error('Failed to send message:', error)
        commit('UPDATE_MESSAGE_STATUS', {
          timestamp: message.timestamp,
          status: 'failed'
        })
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
    isAdmin: state => state.user && state.user.role === 'admin',
    unreadCount: state => state.unreadMessages,
    connectionStatus: state => state.isConnected,
    isDark: state => state.isDarkMode,
    language: state => state.currentLanguage
  }
})
