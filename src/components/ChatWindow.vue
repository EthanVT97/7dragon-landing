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
        :class="['message', getMessageClass(message)]"
      >
        <div class="message-content" :class="message.message_type">
          <!-- Text Message -->
          <p v-if="message.message_type === 'text'">{{ message.content }}</p>

          <!-- Image Message -->
          <div v-else-if="message.message_type === 'image'" class="image-container">
            <img 
              :src="message.file_url" 
              :alt="message.file_name || 'Chat image'"
              @click="openImagePreview(message.file_url)"
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

          <div class="message-meta">
            <span class="message-time">{{ formatTime(message.created_at) }}</span>
            <span class="message-status" v-if="message.sender_type === 'customer'">
              <i class="fas" :class="getStatusIcon(message.status)"></i>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <div class="input-actions">
        <button class="action-btn" @click="triggerFileInput">
          <i class="fas fa-paperclip"></i>
        </button>
        <input 
          type="file" 
          ref="fileInput" 
          @change="handleFileSelection" 
          style="display: none"
          accept="image/*,.pdf,.doc,.docx"
        >
      </div>
      
      <textarea
        v-model="newMessage"
        @keyup.enter.prevent="sendMessage"
        :placeholder="$t('chat.typemessage')"
        rows="1"
        ref="messageInput"
      ></textarea>

      <button 
        class="send-btn" 
        @click="sendMessage"
        :disabled="!newMessage.trim() && !selectedFile"
      >
        <i class="fas fa-paper-plane"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { io } from 'socket.io-client';
import { supabase } from '@/supabase';
import { formatDistanceToNow } from 'date-fns';
import { handleFileUpload } from '@/utils/fileUpload';
import { formatFileSize } from '@/utils/formatters';
import { chatbot } from '@/services/chatbot';

export default {
  name: 'ChatWindow',
  
  props: {
    sessionId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    }
  },

  setup(props) {
    const { t } = useI18n();
    const socket = ref(null);
    const messages = ref([]);
    const newMessage = ref('');
    const isConnected = ref(false);
    const isAuthenticated = ref(false);
    const messagesContainer = ref(null);
    const fileInput = ref(null);
    const imagePreview = ref({ show: false, url: '' });
    const uploadProgress = ref(0);
    const sessionId = ref(null);

    // Initialize chat session
    const initializeChatSession = async () => {
      try {
        // Create a new chat session
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert({
            created_at: new Date().toISOString(),
            status: 'active'
          })
          .select()
          .single();

        if (error) throw error;

        sessionId.value = data.id;
        isAuthenticated.value = true;
        connectSocket();

        // Add initial chatbot message
        const botResponse = await chatbot.handleMessage('', sessionId.value);
        addMessage(botResponse);
      } catch (error) {
        console.error('Error creating chat session:', error);
      }
    };

    // Add message to chat
    const addMessage = (message) => {
      messages.value.push({
        id: Date.now(),
        content: message.content,
        type: message.type,
        created_at: new Date().toISOString(),
        ...message
      });
      scrollToBottom();
    };

    // Send a message
    const sendMessage = async (content, type = 'text', fileData = null) => {
      if (!content.trim() && type === 'text') return;

      try {
        // Add user message to chat
        const userMessage = {
          type: 'user',
          content,
          created_at: new Date().toISOString()
        };
        addMessage(userMessage);

        // Get chatbot response
        const botResponse = await chatbot.handleMessage(content, sessionId.value);
        if (botResponse) {
          addMessage(botResponse);
        }

        // Save message to database
        let messageData = {
          session_id: sessionId.value,
          content,
          message_type: type,
          sender_type: 'user',
          created_at: new Date().toISOString()
        };

        if (fileData) {
          messageData = {
            ...messageData,
            file_url: fileData.url,
            file_name: fileData.name,
            file_size: fileData.size
          };
        }

        const { error } = await supabase
          .from('messages')
          .insert(messageData);

        if (error) throw error;

        newMessage.value = '';
        scrollToBottom();
      } catch (error) {
        console.error('Error sending message:', error);
        addMessage({
          type: 'bot',
          content: 'Sorry, there was an error sending your message. Please try again.'
        });
      }
    };

    // Connect to WebSocket server
    const connectSocket = () => {
      const socketUrl = process.env.NODE_ENV === 'production'
        ? 'https://your-production-url.com'
        : 'http://localhost:3000';

      socket.value = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket']
      });

      socket.value.on('connect', () => {
        console.log('Connected to chat server');
        isConnected.value = true;
        socket.value.emit('join_chat', sessionId.value);
      });

      socket.value.on('admin_message', (message) => {
        addMessage({
          type: 'admin',
          content: message.content,
          created_at: new Date().toISOString()
        });
      });

      socket.value.on('disconnect', () => {
        console.log('Disconnected from chat server');
        isConnected.value = false;
      });

      // Store socket globally for chatbot notifications
      window.socket = socket.value;
    };

    // Initialize chat on component mount
    onMounted(() => {
      initializeChatSession();
    });

    // Cleanup on component unmount
    onUnmounted(() => {
      if (socket.value) {
        socket.value.disconnect();
      }
      chatbot.reset();
    });

    // Format message time
    const formatTime = (timestamp) => {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    };

    // Get message class based on user
    const getMessageClass = (message) => {
      return message.type === 'user' ? 'sent' : message.type === 'bot' ? 'bot' : 'admin';
    };

    // Scroll to bottom of messages
    const scrollToBottom = async () => {
      await nextTick();
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };

    // Open image preview
    const openImagePreview = (url) => {
      imagePreview.value = { show: true, url };
    };

    // Close image preview
    const closeImagePreview = () => {
      imagePreview.value = { show: false, url: '' };
    };

    // Load initial messages
    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', sessionId.value)
          .order('created_at', { ascending: true });

        if (error) throw error;
        messages.value = data;
        scrollToBottom();
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    // Handle file upload
    const handleFileSelection = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        uploadProgress.value = 0;
        const fileData = await handleFileUpload(file, sessionId.value, (progress) => {
          uploadProgress.value = progress;
        });

        if (fileData) {
          const messageType = file.type.startsWith('image/') ? 'image' : 'file';
          await sendMessage(file.name, messageType, fileData);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        addMessage({
          type: 'bot',
          content: 'Sorry, there was an error uploading your file. Please try again.'
        });
      } finally {
        uploadProgress.value = 0;
        if (fileInput.value) {
          fileInput.value.value = '';
        }
      }
    };

    // Trigger file input
    const triggerFileInput = () => {
      if (fileInput.value) {
        fileInput.value.click();
      }
    };

    return {
      messages,
      newMessage,
      isConnected,
      messagesContainer,
      fileInput,
      imagePreview,
      uploadProgress,
      sendMessage,
      handleFileSelection,
      formatTime,
      getMessageClass,
      formatFileSize,
      openImagePreview,
      closeImagePreview,
      triggerFileInput
    };
  }
};
</script>

<style lang="scss" scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(to bottom, #1a1a1a, #2d2d2d);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #333;
    border-bottom: 1px solid #444;

    .chat-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .chat-logo {
        width: 32px;
        height: 32px;
        border-radius: 50%;
      }

      h3 {
        color: #fff;
        margin: 0;
      }
    }

    .chat-status {
      font-size: 0.9rem;
      color: #666;

      &.connected {
        color: #4CAF50;
      }

      i {
        margin-right: 0.5rem;
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
      max-width: 80%;
      margin: 0.5rem 0;

      &.sent {
        align-self: flex-end;
        .message-content {
          background: #2196F3;
          border-radius: 12px 12px 0 12px;
        }
      }

      &.bot {
        align-self: flex-start;
        .message-content {
          background: #424242;
          border-radius: 12px 12px 12px 0;
        }
      }

      &.admin {
        align-self: flex-start;
        .message-content {
          background: #4CAF50;
          border-radius: 12px 12px 12px 0;
        }
      }

      .message-content {
        padding: 0.8rem 1rem;
        color: #fff;
        position: relative;

        p {
          margin: 0;
          word-break: break-word;
        }

        .message-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.4rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .image-container {
          img {
            max-width: 100%;
            border-radius: 8px;
            cursor: pointer;
          }

          .image-caption {
            margin-top: 0.5rem;
            font-size: 0.9rem;
          }
        }

        .file-container {
          .file-download {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #fff;
            text-decoration: none;

            i {
              font-size: 1.2rem;
            }

            small {
              color: rgba(255, 255, 255, 0.7);
            }
          }
        }

        .error-message {
          color: #ff5252;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
      }
    }
  }

  .chat-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: #333;
    border-top: 1px solid #444;

    .input-actions {
      .action-btn {
        background: none;
        border: none;
        color: #fff;
        cursor: pointer;
        padding: 0.5rem;
        font-size: 1.2rem;
        transition: color 0.3s ease;

        &:hover {
          color: #2196F3;
        }
      }
    }

    textarea {
      flex: 1;
      background: #424242;
      border: 1px solid #555;
      border-radius: 20px;
      padding: 0.8rem 1rem;
      color: #fff;
      resize: none;
      font-family: inherit;
      line-height: 1.4;
      max-height: 100px;
      overflow-y: auto;

      &::placeholder {
        color: #888;
      }

      &:focus {
        outline: none;
        border-color: #2196F3;
      }
    }

    .send-btn {
      background: #2196F3;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      cursor: pointer;
      transition: background-color 0.3s ease;

      &:hover {
        background: #1976D2;
      }

      &:disabled {
        background: #666;
        cursor: not-allowed;
      }

      i {
        font-size: 1.2rem;
      }
    }
  }
}

// Scrollbar styling
.chat-messages {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #1a1a1a;
  }

  &::-webkit-scrollbar-thumb {
    background: #666;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #888;
  }
}
</style>
