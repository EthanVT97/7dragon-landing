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
    unreadMessages: 0,
    typingUsers: new Set(),
    selectedFiles: []
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
    },
    SET_TYPING_STATUS(state, { userId, isTyping }) {
      if (isTyping) {
        state.typingUsers.add(userId)
      } else {
        state.typingUsers.delete(userId)
      }
    },
    ADD_REACTION(state, { messageId, reaction, userId }) {
      const message = state.messages.find(m => m.id === messageId)
      if (message) {
        if (!message.reactions) message.reactions = []
        message.reactions.push({ reaction, user_id: userId })
      }
    },
    REMOVE_REACTION(state, { messageId, reaction, userId }) {
      const message = state.messages.find(m => m.id === messageId)
      if (message && message.reactions) {
        message.reactions = message.reactions.filter(r => 
          !(r.user_id === userId && r.reaction === reaction)
        )
      }
    },
    SET_SELECTED_FILES(state, files) {
      state.selectedFiles = files
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
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error

        // Get user profile with role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) throw profileError

        // Set user with profile data
        const userWithProfile = {
          ...data.user,
          ...profile
        }

        commit('SET_USER', userWithProfile)
        return { user: userWithProfile }
      } catch (error) {
        console.error('Login error:', error)
        return { error }
      }
    },

    async checkSession({ commit }) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError) throw profileError

          commit('SET_USER', {
            ...session.user,
            ...profile
          })
        }
        
        return { session }
      } catch (error) {
        console.error('Session check error:', error)
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
      let messageTimestamp = null;
      try {
        if (!state.isConnected) {
          throw new Error('Not connected to chat service')
        }

        // Create message object with timestamp
        messageTimestamp = new Date()
        const messageObj = {
          content,
          timestamp: messageTimestamp,
          isFromUser: true,
          status: 'sending'
        }

        // Add to local state
        commit('ADD_MESSAGE', messageObj)

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
          timestamp: messageTimestamp,
          status: 'sent',
          id: data.id
        })

        return { success: true }
      } catch (error) {
        console.error('Failed to send message:', error)
        if (messageTimestamp) {
          commit('UPDATE_MESSAGE_STATUS', {
            timestamp: messageTimestamp,
            status: 'failed'
          })
        }
        return { error }
      }
    },
    
    async updateTypingStatus({ commit, state }, isTyping) {
      try {
        if (!state.user) return

        const { error } = await supabase
          .from('typing_indicators')
          .upsert({
            user_id: state.user.id,
            last_typed: new Date().toISOString()
          })

        if (error) throw error

        commit('SET_TYPING_STATUS', {
          userId: state.user.id,
          isTyping
        })
      } catch (error) {
        console.error('Failed to update typing status:', error)
      }
    },

    async addReaction({ commit, state }, { messageId, reaction }) {
      try {
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: state.user.id,
            reaction
          })

        if (error) throw error

        commit('ADD_REACTION', {
          messageId,
          reaction,
          userId: state.user.id
        })
      } catch (error) {
        console.error('Failed to add reaction:', error)
      }
    },

    async uploadFiles(context, files) {
      const uploadedFiles = []
      for (const file of files) {
        try {
          const fileName = `${Date.now()}-${file.name}`
          const { data, error } = await supabase.storage
            .from('chat-attachments')
            .upload(fileName, file)

          if (error) throw error

          if (data) {
            uploadedFiles.push({
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              file_path: data.path
            })
          }
        } catch (error) {
          console.error('Failed to upload file:', error)
        }
      }
      return uploadedFiles
    },
    
    async removeReaction({ commit, state }, { messageId, reaction }) {
      try {
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .match({
            message_id: messageId,
            user_id: state.user.id,
            reaction
          })

        if (error) throw error

        commit('REMOVE_REACTION', {
          messageId,
          reaction,
          userId: state.user.id
        })
      } catch (error) {
        console.error('Failed to remove reaction:', error)
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
