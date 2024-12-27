<template>
  <div class="message-search">
    <div class="search-header">
      <div class="search-input">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search messages..."
          @input="debounceSearch"
        >
        <button v-if="searchQuery" @click="clearSearch">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="search-filters">
        <select v-model="filters.messageType">
          <option value="">All Types</option>
          <option value="text">Text</option>
          <option value="image">Image</option>
          <option value="file">File</option>
        </select>
        <select v-model="filters.timeRange">
          <option value="1">Last 24 Hours</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>
    </div>

    <div class="search-results" v-if="searchQuery">
      <div v-if="loading" class="loading">
        <i class="fas fa-spinner fa-spin"></i> Searching...
      </div>
      
      <div v-else-if="results.length === 0" class="no-results">
        No messages found matching your search.
      </div>
      
      <div v-else class="results-list">
        <div 
          v-for="message in results" 
          :key="message.id" 
          class="message-item"
          @click="selectMessage(message)"
        >
          <div class="message-meta">
            <span class="user">{{ message.user?.email || 'Anonymous' }}</span>
            <span class="time">{{ formatDate(message.created_at) }}</span>
          </div>
          <div class="message-preview" :class="message.message_type">
            <i :class="getMessageIcon(message.message_type)"></i>
            <span>{{ getMessagePreview(message) }}</span>
          </div>
          <div class="message-info">
            <span class="session-id">Session: #{{ message.session_id }}</span>
            <div class="reactions" v-if="message.reactions?.length">
              <span 
                v-for="reaction in groupReactions(message.reactions)" 
                :key="reaction.emoji"
                class="reaction"
              >
                {{ reaction.emoji }} {{ reaction.count }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <button 
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
        >
          Previous
        </button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button 
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { supabase } from '@/supabase'
import { format } from 'date-fns'
import debounce from 'lodash/debounce'

export default {
  name: 'MessageSearch',
  
  emits: ['select-message'],

  setup(props, { emit }) {
    const searchQuery = ref('')
    const filters = ref({
      messageType: '',
      timeRange: '7'
    })
    const results = ref([])
    const loading = ref(false)
    const currentPage = ref(1)
    const totalPages = ref(1)
    const itemsPerPage = 10

    // Debounced search function
    const debounceSearch = debounce(() => {
      currentPage.value = 1
      performSearch()
    }, 300)

    // Perform the search
    const performSearch = async () => {
      if (!searchQuery.value) {
        results.value = []
        return
      }

      loading.value = true
      try {
        let query = supabase
          .from('chat_messages')
          .select(`
            *,
            user:user_profiles(email),
            reactions(emoji, user_id)
          `)
          .textSearch('content', searchQuery.value)
          .order('created_at', { ascending: false })

        // Apply filters
        if (filters.value.messageType) {
          query = query.eq('message_type', filters.value.messageType)
        }

        if (filters.value.timeRange !== 'all') {
          const daysAgo = new Date()
          daysAgo.setDate(daysAgo.getDate() - parseInt(filters.value.timeRange))
          query = query.gte('created_at', daysAgo.toISOString())
        }

        // Add pagination
        const from = (currentPage.value - 1) * itemsPerPage
        const to = from + itemsPerPage - 1
        query = query.range(from, to)

        const { data, error, count } = await query

        if (error) throw error

        results.value = data
        totalPages.value = Math.ceil(count / itemsPerPage)
      } catch (error) {
        console.error('Error searching messages:', error)
      } finally {
        loading.value = false
      }
    }

    // Clear search
    const clearSearch = () => {
      searchQuery.value = ''
      results.value = []
    }

    // Select message
    const selectMessage = (message) => {
      emit('select-message', message)
    }

    // Helper functions
    const formatDate = (date) => {
      return format(new Date(date), 'MMM d, yyyy HH:mm')
    }

    const getMessageIcon = (type) => {
      const icons = {
        text: 'fas fa-comment',
        image: 'fas fa-image',
        file: 'fas fa-file',
        error: 'fas fa-exclamation-circle'
      }
      return icons[type] || 'fas fa-comment'
    }

    const getMessagePreview = (message) => {
      switch (message.message_type) {
        case 'image':
          return 'Image message'
        case 'file':
          return `File: ${message.content.filename || 'Unnamed file'}`
        default:
          return message.content
      }
    }

    const groupReactions = (reactions) => {
      const groups = {}
      reactions.forEach(r => {
        if (!groups[r.emoji]) {
          groups[r.emoji] = { emoji: r.emoji, count: 0 }
        }
        groups[r.emoji].count++
      })
      return Object.values(groups)
    }

    // Watch for filter changes
    watch([() => filters.value.messageType, () => filters.value.timeRange], () => {
      currentPage.value = 1
      performSearch()
    })

    return {
      searchQuery,
      filters,
      results,
      loading,
      currentPage,
      totalPages,
      clearSearch,
      debounceSearch,
      selectMessage,
      formatDate,
      getMessageIcon,
      getMessagePreview,
      groupReactions
    }
  }
}
</script>

<style lang="scss" scoped>
.message-search {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;

  .search-header {
    margin-bottom: 1.5rem;

    .search-input {
      position: relative;
      margin-bottom: 1rem;

      i {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
      }

      input {
        width: 100%;
        padding: 0.75rem 2.5rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 1rem;

        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }
      }

      button {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.25rem;

        &:hover {
          color: var(--text-primary);
        }
      }
    }

    .search-filters {
      display: flex;
      gap: 1rem;

      select {
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-primary);
        color: var(--text-primary);
        cursor: pointer;

        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }
      }
    }
  }

  .search-results {
    .loading, .no-results {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary);
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .message-item {
        background: var(--bg-primary);
        border-radius: 8px;
        padding: 1rem;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .message-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;

          .user {
            color: var(--primary-color);
            font-weight: 500;
          }

          .time {
            color: var(--text-secondary);
          }
        }

        .message-preview {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);

          i {
            color: var(--primary-color);
          }

          &.image i {
            color: var(--success);
          }

          &.file i {
            color: var(--warning);
          }
        }

        .message-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;

          .session-id {
            color: var(--text-secondary);
          }

          .reactions {
            display: flex;
            gap: 0.5rem;

            .reaction {
              background: var(--bg-secondary);
              padding: 0.25rem 0.5rem;
              border-radius: 12px;
              font-size: 0.75rem;
            }
          }
        }
      }
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;

      button {
        padding: 0.5rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        cursor: pointer;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        &:not(:disabled):hover {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .message-search {
    padding: 1rem;

    .search-header {
      .search-filters {
        flex-direction: column;

        select {
          width: 100%;
        }
      }
    }
  }
}
</style>
