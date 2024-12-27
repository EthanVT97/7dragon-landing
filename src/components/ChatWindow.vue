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
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 350px;
  height: 500px;
  background-color: var(--color-background);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 255, 127, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.chat-header {
  background-color: var(--color-primary);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-accent);
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .chat-logo {
    width: 30px;
    height: 30px;
    border-radius: 50%;
  }

  h3 {
    margin: 0;
    color: var(--color-text);
  }
}

.chat-status {
  font-size: 0.8rem;
  color: var(--color-text);
  opacity: 0.7;

  &.connected {
    color: var(--color-accent);
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
    background: rgba(255, 255, 255, 0.1);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-secondary);
    border-radius: 3px;
  }
}

.message {
  max-width: 80%;
  animation: fadeIn 0.3s ease;

  &.user-message {
    align-self: flex-end;
    
    .message-content {
      background-color: var(--color-accent);
      color: var(--color-background);
      border-radius: 12px 12px 0 12px;
    }
  }

  &.bot-message {
    align-self: flex-start;
    
    .message-content {
      background-color: var(--color-secondary);
      color: var(--color-text);
      border-radius: 12px 12px 12px 0;
    }
  }
}

.message-content {
  padding: 0.75rem 1rem;
  
  p {
    margin: 0;
    line-height: 1.4;
  }
}

.message-time {
  display: block;
  font-size: 0.7rem;
  margin-top: 0.25rem;
  opacity: 0.7;
}

.typing-indicator {
  display: flex;
  gap: 0.3rem;
  padding: 0.5rem;
  
  span {
    width: 6px;
    height: 6px;
    background-color: var(--color-text);
    border-radius: 50%;
    animation: bounce 1s infinite;
    
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

.chat-input {
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
  background-color: rgba(var(--color-primary), 0.1);
  border-top: 1px solid rgba(var(--color-accent), 0.2);

  textarea {
    flex: 1;
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(var(--color-accent), 0.3);
    border-radius: 20px;
    padding: 0.5rem 1rem;
    color: var(--color-text);
    resize: none;
    max-height: 100px;
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: var(--color-accent);
      background-color: rgba(255, 255, 255, 0.15);
    }
  }
}

.send-button {
  background-color: var(--color-accent);
  color: var(--color-background);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: scale(1.1);
    background-color: var(--color-highlight);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

// Mobile Responsive
@media (max-width: 768px) {
  .chat-window {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
}
</style>
