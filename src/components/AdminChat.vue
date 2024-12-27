<template>
  <div class="admin-chat">
    <div class="sidebar">
      <div class="search-bar">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search users..."
          @input="searchUsers"
        >
      </div>
      <div class="user-list">
        <div 
          v-for="user in filteredUsers" 
          :key="user.id"
          class="user-item"
          :class="{ active: selectedUser?.id === user.id }"
          @click="selectUser(user)"
        >
          <div class="user-avatar">
            <div class="status-indicator" :class="{ online: user.is_online }"></div>
          </div>
          <div class="user-info">
            <div class="user-name">{{ user.username || user.email }}</div>
            <div class="last-message" v-if="user.lastMessage">
              {{ truncateMessage(user.lastMessage.content) }}
            </div>
          </div>
          <div class="message-count" v-if="user.unreadCount">
            {{ user.unreadCount }}
          </div>
        </div>
      </div>
    </div>

    <div class="chat-area" v-if="selectedUser">
      <div class="chat-header">
        <div class="user-info">
          <h3>{{ selectedUser.username || selectedUser.email }}</h3>
          <span class="status">{{ selectedUser.is_online ? 'Online' : 'Offline' }}</span>
        </div>
        <div class="actions">
          <button @click="toggleUserInfo">
            <i class="fas fa-info-circle"></i>
          </button>
        </div>
      </div>

      <div class="messages-container" ref="messagesContainer">
        <div 
          v-for="message in selectedUserMessages" 
          :key="message.id"
          class="message"
          :class="{ 'from-admin': message.from_admin }"
        >
          <div class="message-content">
            {{ message.content }}
            <!-- File Attachments -->
            <div v-if="message.attachments?.length" class="attachments">
              <div v-for="file in message.attachments" :key="file.id" class="attachment">
                <a :href="getFileUrl(file)" target="_blank" class="file-link">
                  <i class="fas" :class="getFileIcon(file.file_type)"></i>
                  {{ file.file_name }}
                </a>
              </div>
            </div>
          </div>
          <div class="message-meta">
            <span class="time">{{ formatTime(message.created_at) }}</span>
            <span class="status" v-if="message.from_admin">{{ message.status }}</span>
          </div>
        </div>
        <div v-if="isTyping" class="typing-indicator">
          {{ selectedUser.username || selectedUser.email }} is typing...
        </div>
      </div>

      <div class="chat-input">
        <label class="file-upload">
          <input 
            type="file" 
            @change="handleFileUpload" 
            multiple 
            accept="image/*,.pdf,.doc,.docx,.txt"
          >
          <i class="fas fa-paperclip"></i>
        </label>
        <textarea
          v-model="newMessage"
          @keyup.enter.prevent="sendMessage"
          @input="handleTyping"
          placeholder="Type your message..."
          :disabled="!isConnected"
        ></textarea>
        <button 
          @click="sendMessage"
          :disabled="!isConnected || (!newMessage.trim() && !selectedFiles.length)"
        >
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>

    <div class="user-info-panel" v-if="showUserInfo && selectedUser">
      <div class="panel-header">
        <h3>User Information</h3>
        <button @click="toggleUserInfo">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="panel-content">
        <div class="info-item">
          <label>Email</label>
          <span>{{ selectedUser.email }}</span>
        </div>
        <div class="info-item">
          <label>Username</label>
          <span>{{ selectedUser.username || 'Not set' }}</span>
        </div>
        <div class="info-item">
          <label>Joined</label>
          <span>{{ formatDate(selectedUser.created_at) }}</span>
        </div>
        <div class="info-item">
          <label>Last Active</label>
          <span>{{ formatDate(selectedUser.last_seen) }}</span>
        </div>
        <div class="info-item">
          <label>Status</label>
          <span :class="{ 'status-online': selectedUser.is_online }">
            {{ selectedUser.is_online ? 'Online' : 'Offline' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import { supabase } from '@/supabase'
import { formatDistanceToNow } from 'date-fns'

export default {
  name: 'AdminChat',
  
  setup() {
    const store = useStore()
    const searchQuery = ref('')
    const selectedUser = ref(null)
    const newMessage = ref('')
    const selectedFiles = ref([])
    const isTyping = ref(false)
    const showUserInfo = ref(false)
    const messagesContainer = ref(null)
    const typingTimeout = ref(null)
    const users = ref([])
    
    // Computed
    const isConnected = computed(() => store.state.isConnected)
    const currentUser = computed(() => store.getters.currentUser)
    
    const filteredUsers = computed(() => {
      if (!searchQuery.value) return users.value
      const query = searchQuery.value.toLowerCase()
      return users.value.filter(user => 
        (user.username?.toLowerCase().includes(query) || 
         user.email.toLowerCase().includes(query))
      )
    })
    
    const selectedUserMessages = computed(() => {
      if (!selectedUser.value) return []
      return store.state.messages.filter(msg => 
        msg.user_id === selectedUser.value.id ||
        (msg.from_admin && msg.to_user_id === selectedUser.value.id)
      )
    })
    
    // Methods
    const searchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', `%${searchQuery.value}%`)
        .limit(20)
      
      if (error) {
        console.error('Error searching users:', error)
        return
      }
      
      users.value = data
    }
    
    const selectUser = async (user) => {
      selectedUser.value = user
      await loadUserMessages(user.id)
      nextTick(() => {
        scrollToBottom()
      })
    }
    
    const loadUserMessages = async (userId) => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          attachments (*),
          reactions (*)
        `)
        .or(`user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error loading messages:', error)
        return
      }
      
      store.commit('SET_MESSAGES', data)
    }
    
    const handleTyping = () => {
      if (typingTimeout.value) {
        clearTimeout(typingTimeout.value)
      }
      
      store.dispatch('updateTypingStatus', true)
      
      typingTimeout.value = setTimeout(() => {
        store.dispatch('updateTypingStatus', false)
      }, 2000)
    }
    
    const handleFileUpload = (event) => {
      selectedFiles.value = Array.from(event.target.files)
    }
    
    const sendMessage = async () => {
      if ((!newMessage.value.trim() && !selectedFiles.value.length) || !isConnected.value) return
      
      try {
        let attachments = []
        if (selectedFiles.value.length) {
          attachments = await store.dispatch('uploadFiles', selectedFiles.value)
        }
        
        await store.dispatch('sendMessage', {
          content: newMessage.value.trim(),
          attachments,
          to_user_id: selectedUser.value.id,
          from_admin: true
        })
        
        newMessage.value = ''
        selectedFiles.value = []
        scrollToBottom()
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    }
    
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }
    
    const toggleUserInfo = () => {
      showUserInfo.value = !showUserInfo.value
    }
    
    const formatTime = (timestamp) => {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    }
    
    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleString()
    }
    
    const truncateMessage = (message, length = 30) => {
      if (!message) return ''
      return message.length > length 
        ? message.substring(0, length) + '...' 
        : message
    }
    
    const getFileUrl = (file) => {
      return supabase.storage
        .from('chat-attachments')
        .getPublicUrl(file.file_path).data.publicUrl
    }
    
    const getFileIcon = (fileType) => {
      if (fileType.startsWith('image/')) return 'fa-image'
      if (fileType.includes('pdf')) return 'fa-file-pdf'
      if (fileType.includes('doc')) return 'fa-file-word'
      return 'fa-file'
    }
    
    // Lifecycle hooks
    onMounted(async () => {
      await searchUsers()
      
      const messageSubscription = supabase
        .channel('public:messages')
        .on('INSERT', async (payload) => {
          const newMessage = payload.new
          if (selectedUser.value?.id === newMessage.user_id) {
            await loadUserMessages(selectedUser.value.id)
            nextTick(() => {
              scrollToBottom()
            })
          }
        })
        .subscribe()
      
      const typingSubscription = supabase
        .channel('public:typing_indicators')
        .on('INSERT', (payload) => {
          if (selectedUser.value?.id === payload.new.user_id) {
            isTyping.value = true
            setTimeout(() => {
              isTyping.value = false
            }, 3000)
          }
        })
        .subscribe()
      
      onUnmounted(() => {
        messageSubscription.unsubscribe()
        typingSubscription.unsubscribe()
        if (typingTimeout.value) {
          clearTimeout(typingTimeout.value)
        }
      })
    })
    
    return {
      searchQuery,
      selectedUser,
      newMessage,
      selectedFiles,
      isTyping,
      showUserInfo,
      messagesContainer,
      users,
      filteredUsers,
      selectedUserMessages,
      isConnected,
      searchUsers,
      selectUser,
      handleTyping,
      handleFileUpload,
      sendMessage,
      toggleUserInfo,
      formatTime,
      formatDate,
      truncateMessage,
      getFileUrl,
      getFileIcon
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-chat {
  display: flex;
  height: 100vh;
  background: #f5f5f5;
  
  .sidebar {
    width: 300px;
    border-right: 1px solid #ddd;
    display: flex;
    flex-direction: column;
    background: white;
    
    .search-bar {
      padding: 16px;
      border-bottom: 1px solid #ddd;
      
      input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        
        &:focus {
          outline: none;
          border-color: $primary;
        }
      }
    }
    
    .user-list {
      flex: 1;
      overflow-y: auto;
      
      .user-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        
        &:hover {
          background: #f9f9f9;
        }
        
        &.active {
          background: rgba($primary, 0.1);
        }
        
        .user-avatar {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #ddd;
          margin-right: 12px;
          
          .status-indicator {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #ccc;
            border: 2px solid white;
            
            &.online {
              background: #4caf50;
            }
          }
        }
        
        .user-info {
          flex: 1;
          min-width: 0;
          
          .user-name {
            font-weight: 500;
            margin-bottom: 4px;
          }
          
          .last-message {
            font-size: 0.9em;
            color: #666;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
        
        .message-count {
          background: $primary;
          color: white;
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8em;
          padding: 0 6px;
        }
      }
    }
  }
  
  .chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .chat-header {
      padding: 16px;
      background: white;
      border-bottom: 1px solid #ddd;
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .user-info {
        h3 {
          margin: 0;
          margin-bottom: 4px;
        }
        
        .status {
          font-size: 0.9em;
          color: #666;
        }
      }
      
      .actions {
        button {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: #666;
          
          &:hover {
            color: $primary;
          }
        }
      }
    }
    
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      
      .message {
        margin-bottom: 16px;
        max-width: 70%;
        
        &.from-admin {
          margin-left: auto;
          
          .message-content {
            background: $primary;
            color: white;
          }
        }
        
        .message-content {
          background: white;
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .message-meta {
          margin-top: 4px;
          font-size: 0.8em;
          color: #666;
          display: flex;
          justify-content: space-between;
        }
      }
      
      .typing-indicator {
        font-size: 0.9em;
        color: #666;
        font-style: italic;
        margin-bottom: 16px;
      }
    }
    
    .chat-input {
      padding: 16px;
      background: white;
      border-top: 1px solid #ddd;
      display: flex;
      gap: 12px;
      align-items: flex-end;
      
      .file-upload {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #f1f1f1;
        cursor: pointer;
        
        input {
          display: none;
        }
        
        i {
          color: #666;
        }
        
        &:hover {
          background: darken(#f1f1f1, 5%);
        }
      }
      
      textarea {
        flex: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        resize: none;
        min-height: 40px;
        max-height: 120px;
        
        &:focus {
          outline: none;
          border-color: $primary;
        }
      }
      
      button {
        padding: 8px 16px;
        background: $primary;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        &:hover:not(:disabled) {
          background: darken($primary, 5%);
        }
      }
    }
  }
  
  .user-info-panel {
    width: 300px;
    background: white;
    border-left: 1px solid #ddd;
    
    .panel-header {
      padding: 16px;
      border-bottom: 1px solid #ddd;
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      h3 {
        margin: 0;
      }
      
      button {
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        color: #666;
        
        &:hover {
          color: $primary;
        }
      }
    }
    
    .panel-content {
      padding: 16px;
      
      .info-item {
        margin-bottom: 16px;
        
        label {
          display: block;
          font-weight: 500;
          margin-bottom: 4px;
          color: #666;
        }
        
        span {
          &.status-online {
            color: #4caf50;
          }
        }
      }
    }
  }
}

.attachments {
  margin-top: 8px;
  
  .attachment {
    margin-top: 4px;
    
    .file-link {
      display: inline-flex;
      align-items: center;
      color: inherit;
      text-decoration: none;
      
      i {
        margin-right: 5px;
      }
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
