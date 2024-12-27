import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
const supabaseAnonKey = process.env.VUE_APP_SUPABASE_KEY

// Create Supabase client with realtime configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Enable realtime subscriptions for specific tables
const enableRealtimeForTables = async () => {
  try {
    await supabase.removeAllChannels()
    
    const channels = [
      'chat_messages',
      'message_reactions',
      'message_replies',
      'typing_indicators',
      'admin_notifications'
    ]

    channels.forEach(channel => {
      supabase
        .channel(channel)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: channel
        }, payload => {
          console.log(`Realtime update for ${channel}:`, payload)
        })
        .subscribe((status) => {
          console.log(`Subscription status for ${channel}:`, status)
        })
    })
  } catch (error) {
    console.error('Error setting up realtime subscriptions:', error)
  }
}

// Initialize realtime subscriptions
enableRealtimeForTables()

// Export reusable database functions
export const db = {
  /**
   * Execute a stored function
   * @param {string} functionName - Name of the function to execute
   * @param {Object} params - Parameters to pass to the function
   * @returns {Promise} - Result of the function call
   */
  executeFunction: async (functionName, params = {}) => {
    try {
      const { data, error } = await supabase.rpc(functionName, params)
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error(`Error executing function ${functionName}:`, error)
      return { data: null, error }
    }
  },

  /**
   * Perform a full text search on messages
   * @param {string} query - Search query
   * @param {Object} options - Search options (limit, offset, filters)
   * @returns {Promise} - Search results
   */
  searchMessages: async (query, options = {}) => {
    try {
      let queryBuilder = supabase
        .from('chat_messages')
        .select(`
          *,
          user:user_profiles(email),
          reactions:message_reactions(*)
        `)
        .textSearch('search_vector', query)

      // Apply filters
      if (options.messageType) {
        queryBuilder = queryBuilder.eq('message_type', options.messageType)
      }

      if (options.timeRange && options.timeRange !== 'all') {
        const daysAgo = new Date()
        daysAgo.setDate(daysAgo.getDate() - parseInt(options.timeRange))
        queryBuilder = queryBuilder.gte('created_at', daysAgo.toISOString())
      }

      // Apply pagination
      if (options.limit) {
        queryBuilder = queryBuilder.limit(options.limit)
      }
      if (options.offset) {
        queryBuilder = queryBuilder.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        )
      }

      // Execute query
      const { data, error, count } = await queryBuilder

      if (error) throw error
      return { data, count, error: null }
    } catch (error) {
      console.error('Error searching messages:', error)
      return { data: null, count: 0, error }
    }
  },

  /**
   * Get chat statistics
   * @returns {Promise} - Chat statistics
   */
  getChatStats: async () => {
    try {
      const { data, error } = await supabase.rpc('get_chat_statistics')
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error getting chat statistics:', error)
      return { data: null, error }
    }
  }
}

// Export helper functions
export const helpers = {
  /**
   * Subscribe to realtime updates for a specific record
   * @param {string} table - Table name
   * @param {string} id - Record ID
   * @param {Function} callback - Callback function for updates
   * @returns {Object} - Subscription object
   */
  subscribeToRecord: (table, id, callback) => {
    return supabase
      .channel(`${table}:${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table,
        filter: `id=eq.${id}`
      }, payload => {
        callback(payload)
      })
      .subscribe()
  },

  /**
   * Clean up typing indicators
   * Removes stale typing indicators older than 5 seconds
   */
  cleanupTypingIndicators: async () => {
    try {
      const fiveSecondsAgo = new Date()
      fiveSecondsAgo.setSeconds(fiveSecondsAgo.getSeconds() - 5)

      await supabase
        .from('typing_indicators')
        .delete()
        .lt('updated_at', fiveSecondsAgo.toISOString())
    } catch (error) {
      console.error('Error cleaning up typing indicators:', error)
    }
  }
}

// Set up periodic cleanup of typing indicators
setInterval(helpers.cleanupTypingIndicators, 5000)
