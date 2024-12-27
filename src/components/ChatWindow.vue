<template>
  <div class="chat-window">
    <div class="chat-header">
      <div class="chat-title">
        <img src="@/assets/18kchatlogo.jpg" alt="18K Chat" class="chat-logo">
        <h3>18K Chat</h3>
      </div>
      <div class="chat-status" :class="{ 'connected': isConnected }">
        {{ isConnected ? $t('chat.connected') : $t('chat.connecting') }}
      </div>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="(message, index) in messages" 
        :key="index"
        :class="['message', message.isFromUser ? 'user-message' : 'bot-message']"
      >
        <div class="message-content">
          <p>{{ message.content }}</p>
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
        </div>
      </div>
      <div v-if="isTyping" class="message bot-message typing">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <textarea
        v-model="newMessage"
        :placeholder="$t('chat.placeholder')"
        @keydown.enter.prevent="sendMessage"
        rows="1"
        ref="messageInput"
      ></textarea>
      <button 
        @click="sendMessage"
        :disabled="!newMessage.trim() || !isConnected"
        class="send-button"
      >
        <i class="fas fa-paper-plane"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

export default {
  name: 'ChatWindow',
  setup() {
    const store = useStore()
    const { t } = useI18n()
    
    const newMessage = ref('')
    const isTyping = ref(false)
    const messagesContainer = ref(null)
    const messageInput = ref(null)
    
    const messages = computed(() => store.getters.messageHistory)
    const isConnected = computed(() => store.state.isConnected)
    
    // Auto-resize textarea
    const adjustTextareaHeight = () => {
      const textarea = messageInput.value
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
      }
    }
    
    // Scroll to bottom of messages
    const scrollToBottom = async () => {
      await nextTick()
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }
    
    // Format timestamp
    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
    
    // Send message
    const sendMessage = async () => {
      const content = newMessage.value.trim()
      if (!content || !isConnected.value) return
      
      newMessage.value = ''
      adjustTextareaHeight()
      
      const { error } = await store.dispatch('sendMessage', content)
      if (error) {
        // Handle error
        console.error('Failed to send message:', error)
        return
      }
      
      // Simulate bot typing
      isTyping.value = true
      setTimeout(() => {
        isTyping.value = false
        // Add bot response
        store.commit('ADD_MESSAGE', {
          content: t('chat.autoResponse'),
          timestamp: new Date(),
          isFromUser: false
        })
        scrollToBottom()
      }, 2000)
      
      scrollToBottom()
    }
    
    // Watch for new messages
    watch(messages, () => {
      scrollToBottom()
    })
    
    // Watch for textarea content changes
    watch(newMessage, () => {
      adjustTextareaHeight()
    })
    
    onMounted(() => {
      // Add welcome message
      if (messages.value.length === 0) {
        store.commit('ADD_MESSAGE', {
          content: t('chat.welcome'),
          timestamp: new Date(),
          isFromUser: false
        })
      }
      
      // Focus input
      messageInput.value?.focus()
      
      // Connect to chat service
      store.dispatch('setConnectionStatus', true)
    })
    
    return {
      newMessage,
      isTyping,
      messages,
      isConnected,
      messagesContainer,
      messageInput,
      sendMessage,
      formatTime
    }
  }
}
</script>

<style lang="scss" scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #0f1c2c 0%, #1a2a3d 100%);
  color: #e0e7ff;
}

.chat-header {
  padding: 1rem;
  background: rgba(26, 42, 61, 0.9);
  border-bottom: 1px solid rgba(82, 215, 183, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 1rem;

  .chat-logo {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid #52d7b7;
  }

  h3 {
    color: #52d7b7;
    margin: 0;
    font-size: 1.5rem;
  }
}

.chat-status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  background: rgba(82, 215, 183, 0.1);
  border: 1px solid rgba(82, 215, 183, 0.3);
  
  &.connected {
    background: rgba(82, 215, 183, 0.2);
    color: #52d7b7;
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(26, 42, 61, 0.9);
  }
  
  &::-webkit-scrollbar-thumb {
    background: #52d7b7;
    border-radius: 3px;
  }
}

.message {
  max-width: 80%;
  padding: 1rem;
  border-radius: 12px;
  position: relative;
  animation: fadeIn 0.3s ease-out;
  
  &.user-message {
    align-self: flex-end;
    background: linear-gradient(135deg, #52d7b7 0%, #3eaf7c 100%);
    color: #fff;
    
    .message-time {
      color: rgba(255, 255, 255, 0.8);
    }
  }
  
  &.bot-message {
    align-self: flex-start;
    background: rgba(26, 42, 61, 0.9);
    border: 1px solid rgba(82, 215, 183, 0.3);
    
    .message-time {
      color: rgba(224, 231, 255, 0.6);
    }
  }
}

.message-content {
  p {
    margin: 0 0 0.5rem 0;
    line-height: 1.5;
  }
}

.message-time {
  font-size: 0.8rem;
  opacity: 0.8;
}

.chat-input {
  padding: 1rem;
  background: rgba(26, 42, 61, 0.9);
  border-top: 1px solid rgba(82, 215, 183, 0.3);
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  
  textarea {
    flex: 1;
    padding: 0.8rem;
    border-radius: 8px;
    border: 1px solid rgba(82, 215, 183, 0.3);
    background: rgba(15, 28, 44, 0.8);
    color: #e0e7ff;
    resize: none;
    min-height: 20px;
    max-height: 150px;
    transition: all 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: #52d7b7;
      background: rgba(15, 28, 44, 0.95);
    }
    
    &::placeholder {
      color: rgba(224, 231, 255, 0.5);
    }
  }
}

.send-button {
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #52d7b7 0%, #3eaf7c 100%);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(82, 215, 183, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.typing-indicator {
  display: flex;
  gap: 0.3rem;
  padding: 1rem;
  
  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #52d7b7;
    animation: bounce 1.4s infinite ease-in-out;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>
