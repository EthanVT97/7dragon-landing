<template>
  <div class="chat-sessions-admin">
    <div class="header">
      <h2>Chat Sessions Management</h2>
      <div class="filters">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search by user or title..."
          @input="handleSearch"
        >
        <select v-model="statusFilter">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select v-model="sortBy">
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest</option>
          <option value="messages">Most Messages</option>
        </select>
      </div>
    </div>

    <div class="sessions-list" v-if="!isLoading">
      <div 
        v-for="session in filteredSessions" 
        :key="session.id" 
        class="session-card"
      >
        <div class="session-header">
          <h3>{{ session.title || 'Untitled Chat' }}</h3>
          <span :class="['status', session.is_active ? 'active' : 'inactive']">
            {{ session.is_active ? 'Active' : 'Inactive' }}
          </span>
        </div>
        
        <div class="session-info">
          <div class="info-item">
            <i class="fas fa-user"></i>
            <span>{{ session.user?.email || 'Unknown User' }}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-calendar"></i>
            <span>{{ formatDate(session.created_at) }}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-comments"></i>
            <span>{{ session.message_count || 0 }} messages</span>
          </div>
          <div class="info-item">
            <i class="fas fa-clock"></i>
            <span>Last active: {{ formatDate(session.last_message_at) }}</span>
          </div>
        </div>

        <div class="session-actions">
          <button @click="viewSession(session.id)" class="btn-view">
            <i class="fas fa-eye"></i> View
          </button>
          <button 
            @click="toggleSessionStatus(session)" 
            :class="['btn-toggle', session.is_active ? 'active' : 'inactive']"
          >
            <i class="fas" :class="session.is_active ? 'fa-pause' : 'fa-play'"></i>
            {{ session.is_active ? 'Deactivate' : 'Activate' }}
          </button>
          <button @click="deleteSession(session.id)" class="btn-delete">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>

    <div v-else class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading sessions...
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

    <!-- Session View Modal -->
    <Modal v-if="selectedSession" @close="selectedSession = null">
      <template #header>
        <h3>Session Details</h3>
      </template>
      <template #default>
        <div class="session-details">
          <ChatMessages 
            :messages="sessionMessages" 
            :loading="loadingMessages"
          />
        </div>
      </template>
    </Modal>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'
import Modal from '@/components/Modal.vue'
import ChatMessages from '@/components/ChatMessages.vue'
import { getChatHistory } from '@/utils/chatSession'

export default {
  name: 'ChatSessionsAdmin',
  
  components: {
    Modal,
    ChatMessages
  },

  setup() {
    const store = useStore()
    const sessions = ref([])
    const isLoading = ref(true)
    const searchQuery = ref('')
    const statusFilter = ref('all')
    const sortBy = ref('recent')
    const currentPage = ref(1)
    const itemsPerPage = 10
    const selectedSession = ref(null)
    const sessionMessages = ref([])
    const loadingMessages = ref(false)

    // Get all chat sessions
    const loadSessions = async () => {
      isLoading.value = true
      try {
        const { data, error } = await supabase
          .from('chat_sessions')
          .select(`
            *,
            user:user_id (
              email,
              user_metadata
            ),
            message_count:chat_messages (count)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        sessions.value = data
      } catch (error) {
        console.error('Error loading sessions:', error)
        store.commit('SET_ERROR', 'Failed to load chat sessions')
      } finally {
        isLoading.value = false
      }
    }

    // Filter and sort sessions
    const filteredSessions = computed(() => {
      let filtered = [...sessions.value]

      // Apply search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(session => 
          session.title?.toLowerCase().includes(query) ||
          session.user?.email.toLowerCase().includes(query)
        )
      }

      // Apply status filter
      if (statusFilter.value !== 'all') {
        filtered = filtered.filter(session => 
          statusFilter.value === 'active' ? session.is_active : !session.is_active
        )
      }

      // Apply sorting
      switch (sortBy.value) {
        case 'oldest':
          filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          break
        case 'messages':
          filtered.sort((a, b) => (b.message_count?.[0]?.count || 0) - (a.message_count?.[0]?.count || 0))
          break
        default: // recent
          filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }

      return filtered
    })

    // Pagination
    const totalPages = computed(() => 
      Math.ceil(filteredSessions.value.length / itemsPerPage)
    )

    const paginatedSessions = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredSessions.value.slice(start, end)
    })

    const changePage = (page) => {
      currentPage.value = page
    }

    // View session details
    const viewSession = async (sessionId) => {
      selectedSession.value = sessions.value.find(s => s.id === sessionId)
      loadingMessages.value = true
      
      try {
        const { data, error } = await getChatHistory(sessionId)
        if (error) throw error
        sessionMessages.value = data
      } catch (error) {
        console.error('Error loading session messages:', error)
        store.commit('SET_ERROR', 'Failed to load session messages')
      } finally {
        loadingMessages.value = false
      }
    }

    // Toggle session status
    const toggleSessionStatus = async (session) => {
      try {
        const { error } = await supabase
          .from('chat_sessions')
          .update({ is_active: !session.is_active })
          .eq('id', session.id)

        if (error) throw error

        // Update local state
        session.is_active = !session.is_active
      } catch (error) {
        console.error('Error toggling session status:', error)
        store.commit('SET_ERROR', 'Failed to update session status')
      }
    }

    // Delete session
    const deleteSession = async (sessionId) => {
      if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
        return
      }

      try {
        const { error } = await supabase
          .from('chat_sessions')
          .delete()
          .eq('id', sessionId)

        if (error) throw error

        // Remove from local state
        sessions.value = sessions.value.filter(s => s.id !== sessionId)
      } catch (error) {
        console.error('Error deleting session:', error)
        store.commit('SET_ERROR', 'Failed to delete session')
      }
    }

    // Format date
    const formatDate = (date) => {
      if (!date) return 'Never'
      return format(new Date(date), 'MMM d, yyyy HH:mm')
    }

    // Load sessions on mount
    onMounted(loadSessions)

    return {
      sessions: paginatedSessions,
      isLoading,
      searchQuery,
      statusFilter,
      sortBy,
      currentPage,
      totalPages,
      selectedSession,
      sessionMessages,
      loadingMessages,
      formatDate,
      changePage,
      viewSession,
      toggleSessionStatus,
      deleteSession
    }
  }
}
</script>

<style lang="scss" scoped>
.chat-sessions-admin {
  padding: 2rem;

  .header {
    margin-bottom: 2rem;

    h2 {
      margin-bottom: 1rem;
      color: var(--text-primary);
    }

    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;

      input, select {
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-secondary);
        color: var(--text-primary);

        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }
      }
    }
  }

  .sessions-list {
    display: grid;
    gap: 1rem;

    .session-card {
      background: var(--bg-secondary);
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      .session-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;

        h3 {
          margin: 0;
          color: var(--text-primary);
        }

        .status {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.875rem;

          &.active {
            background: var(--success-light);
            color: var(--success);
          }

          &.inactive {
            background: var(--error-light);
            color: var(--error);
          }
        }
      }

      .session-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);

          i {
            color: var(--primary-color);
          }
        }
      }

      .session-actions {
        display: flex;
        gap: 0.5rem;

        button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;

          &.btn-view {
            background: var(--primary-color);
            color: white;

            &:hover {
              background: var(--primary-dark);
            }
          }

          &.btn-toggle {
            &.active {
              background: var(--warning-light);
              color: var(--warning);

              &:hover {
                background: var(--warning);
                color: white;
              }
            }

            &.inactive {
              background: var(--success-light);
              color: var(--success);

              &:hover {
                background: var(--success);
                color: white;
              }
            }
          }

          &.btn-delete {
            background: var(--error-light);
            color: var(--error);

            &:hover {
              background: var(--error);
              color: white;
            }
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
    margin-top: 2rem;

    button {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--bg-secondary);
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

  .loading {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);

    i {
      margin-right: 0.5rem;
    }
  }
}

// Modal styles
.session-details {
  max-height: 70vh;
  overflow-y: auto;
  padding: 1rem;
}
</style>
