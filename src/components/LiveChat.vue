<template>
  <div class="live-chat" :class="{ 'is-open': isOpen }">
    <!-- Chat Toggle Button -->
    <button 
      class="chat-toggle"
      @click="toggleChat"
      :class="{ 'has-unread': unreadCount > 0 }"
    >
      <i class="fas" :class="isOpen ? 'fa-times' : 'fa-comments'"></i>
      <span v-if="unreadCount" class="unread-badge">{{ unreadCount }}</span>
    </button>

    <!-- Chat Window -->
    <div class="chat-window" v-show="isOpen">
      <div class="chat-header">
        <h3>Live Chat Support</h3>
        <div class="status" :class="{ 'online': isConnected }">
          {{ isConnected ? 'Online' : 'Connecting...' }}
        </div>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div 
          v-for="msg in messages" 
          :key="msg.id" 
          class="message"
          :class="{ 'from-user': msg.isFromUser }"
        >
          <div class="message-content">
            {{ msg.content }}
          </div>
          <div class="message-time">
            {{ formatTime(msg.timestamp) }}
          </div>
          <div v-if="msg.isFromUser" class="message-status">
            {{ msg.status }}
          </div>
        </div>
      </div>

      <div class="chat-input">
        <textarea
          v-model="newMessage"
          @keyup.enter.prevent="sendMessage"
          placeholder="Type your message..."
          :disabled="!isConnected"
        ></textarea>
        <button 
          @click="sendMessage"
          :disabled="!isConnected || !newMessage.trim()"
        >
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import { supabase } from '@/supabase'

export default {
  name: 'LiveChat',
  
  setup() {
    const store = useStore()
    const isOpen = ref(false)
    const newMessage = ref('')
    const messagesContainer = ref(null)
    
    // Computed properties
    const messages = computed(() => store.state.messages)
    const isConnected = computed(() => store.state.isConnected)
    const unreadCount = computed(() => store.state.unreadMessages)
    
    // Methods
    const toggleChat = () => {
      isOpen.value = !isOpen.value
      if (isOpen.value) {
        store.dispatch('resetUnreadCount')
        nextTick(() => {
          scrollToBottom()
        })
      }
    }
    
    const sendMessage = async () => {
      if (!newMessage.value.trim() || !isConnected.value) return
      
      try {
        await store.dispatch('sendMessage', newMessage.value.trim())
        newMessage.value = ''
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
    
    const formatTime = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    
    // Lifecycle hooks
    onMounted(async () => {
      await store.dispatch('testConnection')
      
      // Subscribe to new messages
      const subscription = supabase
        .channel('public:messages')
        .on('INSERT', (payload) => {
          if (!payload.new.is_from_user) {
            store.commit('ADD_MESSAGE', {
              content: payload.new.content,
              timestamp: payload.new.created_at,
              isFromUser: false,
              id: payload.new.id
            })
            if (!document.hasFocus() || !isOpen.value) {
              store.commit('INCREMENT_UNREAD')
            }
            if (isOpen.value) {
              nextTick(() => {
                scrollToBottom()
              })
            }
          }
        })
        .subscribe()
        
      // Cleanup subscription
      onUnmounted(() => {
        subscription.unsubscribe()
      })
    })
    
    return {
      isOpen,
      newMessage,
      messages,
      isConnected,
      unreadCount,
      messagesContainer,
      toggleChat,
      sendMessage,
      formatTime
    }
  }
}
</script>

<style lang="scss" scoped>
.live-chat {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.chat-toggle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, $primary, darken($primary, 15%));
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
  }
  
  &.has-unread::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 12px;
    height: 12px;
    background: $error;
    border-radius: 50%;
    border: 2px solid white;
  }
}

.chat-window {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 300px;
  height: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 15px;
  background: linear-gradient(135deg, $primary, darken($primary, 15%));
  color: white;
  
  h3 {
    margin: 0;
    font-size: 16px;
  }
  
  .status {
    font-size: 12px;
    opacity: 0.8;
    
    &.online::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #2ecc71;
      border-radius: 50%;
      margin-right: 5px;
    }
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  
  .message {
    margin-bottom: 10px;
    max-width: 80%;
    
    &.from-user {
      margin-left: auto;
      
      .message-content {
        background: $primary;
        color: white;
        border-radius: 12px 12px 0 12px;
      }
    }
    
    &:not(.from-user) .message-content {
      background: #f1f1f1;
      border-radius: 12px 12px 12px 0;
    }
  }
  
  .message-content {
    padding: 8px 12px;
    word-break: break-word;
  }
  
  .message-time {
    font-size: 10px;
    color: #666;
    margin-top: 2px;
  }
  
  .message-status {
    font-size: 10px;
    color: #666;
    text-align: right;
  }
}

.chat-input {
  padding: 15px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
  
  textarea {
    flex: 1;
    border: 1px solid #ddd;
    border-radius: 20px;
    padding: 8px 12px;
    resize: none;
    height: 40px;
    font-family: inherit;
    
    &:focus {
      outline: none;
      border-color: $primary;
    }
  }
  
  button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: $primary;
    border: none;
    color: white;
    cursor: pointer;
    transition: transform 0.2s ease;
    
    &:hover:not(:disabled) {
      transform: scale(1.1);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: $error;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}
</style>
