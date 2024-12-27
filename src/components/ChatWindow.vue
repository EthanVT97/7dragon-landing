<template>
  <div class="chat-window">
    <div class="chat-header">
      <div class="chat-title">
        <img src="@/assets/18kchatlogo.jpg" alt="18K Chat" class="chat-logo">
        <h3>18K Chat</h3>
      </div>
      <div class="chat-status" :class="{ 'connected': isConnected }">
        <i class="fas" :class="isConnected ? 'fa-check-circle' : 'fa-exclamation-circle'"></i>
        {{ isConnected ? $t('chat.connected') : $t('chat.connecting') }}
      </div>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="message in messages" 
        :key="message.id"
        :class="['message', message.user_id ? 'user-message' : 'bot-message']"
      >
        <div class="message-content" :class="message.message_type">
          <!-- Text Message -->
          <p v-if="message.message_type === 'text'">{{ message.content }}</p>

          <!-- Image Message -->
          <div v-else-if="message.message_type === 'image'" class="image-container">
            <img 
              :src="message.image_url" 
              :alt="message.file_name || 'Chat image'"
              @click="openImagePreview(message.image_url)"
              loading="lazy"
            >
            <p v-if="message.content" class="image-caption">{{ message.content }}</p>
          </div>

          <!-- File Message -->
          <div v-else-if="message.message_type === 'file'" class="file-container">
            <a :href="message.file_url" target="_blank" class="file-download">
              <i class="fas fa-file"></i>
              <span>{{ message.file_name }}</span>
              <small>{{ formatFileSize(message.file_size) }}</small>
            </a>
          </div>

          <!-- Error Message -->
          <div v-else-if="message.message_type === 'error'" class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ message.error_message }}</span>
          </div>

          <span class="message-time">{{ formatTime(message.created_at) }}</span>
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

    <ChatInput 
      :session-id="sessionId"
      :is-connected="isConnected"
      @message-sent="handleMessageSent"
    />
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import ChatInput from './ChatInput.vue'
import { formatDistanceToNow } from 'date-fns'

export default {
  name: 'ChatWindow',
  components: {
    ChatInput
  },

  props: {
    sessionId: {
      type: String,
      required: true
    }
  },

  setup(props) {
    const store = useStore()
    const messagesContainer = ref(null)
    const messages = ref([])
    const isConnected = ref(false)
    const isTyping = ref(false)
    const imagePreviewUrl = ref(null)

    // Load messages
    const loadMessages = async () => {
      try {
        const { data, error } = await store.dispatch('loadChatMessages', props.sessionId)
        if (error) throw error
        messages.value = data
        scrollToBottom()
      } catch (err) {
        console.error('Error loading messages:', err)
      }
    }

    // Format timestamp
    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    }

    // Format file size
    const formatFileSize = (bytes) => {
      if (!bytes) return '0 B'
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
    }

    // Scroll to bottom of messages
    const scrollToBottom = async () => {
      await nextTick()
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }

    // Handle new message
    const handleMessageSent = (message) => {
      messages.value.push(message)
      scrollToBottom()
    }

    // Image preview
    const openImagePreview = (url) => {
      imagePreviewUrl.value = url
      // Implement image preview modal/lightbox here
    }

    // Watch for new messages
    watch(() => store.state.chat.messages, (newMessages) => {
      messages.value = newMessages
      scrollToBottom()
    })

    // Watch connection status
    watch(() => store.state.chat.isConnected, (newStatus) => {
      isConnected.value = newStatus
    })

    onMounted(() => {
      loadMessages()
      isConnected.value = true // Set this based on your actual connection status
    })

    return {
      messages,
      isConnected,
      isTyping,
      messagesContainer,
      formatTime,
      formatFileSize,
      handleMessageSent,
      openImagePreview
    }
  }
}
</script>

<style lang="scss" scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  .chat-header {
    padding: 1rem;
    background: var(--primary-color);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .chat-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .chat-logo {
        width: 32px;
        height: 32px;
        border-radius: 50%;
      }
    }

    .chat-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      opacity: 0.8;

      &.connected {
        opacity: 1;
      }
    }
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .message {
      display: flex;
      margin-bottom: 1rem;

      &.user-message {
        justify-content: flex-end;

        .message-content {
          background: var(--primary-color);
          color: white;
          border-radius: 12px 12px 0 12px;
        }
      }

      &.bot-message {
        justify-content: flex-start;

        .message-content {
          background: var(--message-bg);
          border-radius: 12px 12px 12px 0;
        }
      }

      .message-content {
        max-width: 70%;
        padding: 0.75rem 1rem;
        position: relative;

        &.image {
          padding: 0.5rem;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
        }

        p {
          margin: 0;
          word-break: break-word;
        }

        .message-time {
          font-size: 0.75rem;
          opacity: 0.7;
          margin-top: 0.25rem;
          display: block;
        }

        .image-container {
          img {
            max-width: 100%;
            max-height: 300px;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s;

            &:hover {
              transform: scale(1.02);
            }
          }

          .image-caption {
            margin-top: 0.5rem;
            font-size: 0.875rem;
          }
        }

        .file-container {
          .file-download {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: inherit;
            text-decoration: none;
            padding: 0.5rem;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 4px;
            transition: background 0.2s;

            &:hover {
              background: rgba(0, 0, 0, 0.1);
            }

            small {
              opacity: 0.7;
            }
          }
        }
      }
    }

    .typing {
      .typing-indicator {
        display: flex;
        gap: 0.25rem;
        padding: 0.5rem;

        span {
          width: 8px;
          height: 8px;
          background: var(--text-color);
          border-radius: 50%;
          animation: typing 1s infinite;

          &:nth-child(2) { animation-delay: 0.2s; }
          &:nth-child(3) { animation-delay: 0.4s; }
        }
      }
    }
  }
}

@keyframes typing {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
</style>
