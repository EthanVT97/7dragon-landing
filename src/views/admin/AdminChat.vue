<template>
  <div class="admin-chat">
    <div class="chat-sessions">
      <h2>Active Sessions</h2>
      <div class="sessions-list">
        <div 
          v-for="session in sessions" 
          :key="session.id"
          :class="['session-item', { active: currentSession?.id === session.id }]"
          @click="selectSession(session)"
        >
          <div class="session-info">
            <h3>{{ session.user?.name || 'Anonymous User' }}</h3>
            <p>{{ formatTime(session.created_at) }}</p>
          </div>
          <div class="session-meta">
            <span class="message-count">{{ session.messages_count }} messages</span>
            <span :class="['session-status', session.status]">{{ session.status }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-window" v-if="currentSession">
      <div class="chat-header">
        <div class="user-info">
          <h3>{{ currentSession.user?.name || 'Anonymous User' }}</h3>
          <span class="user-status">{{ currentSession.status }}</span>
        </div>
        <div class="actions">
          <button @click="closeSession" v-if="currentSession.status === 'active'">
            Close Chat
          </button>
        </div>
      </div>

      <div class="messages" ref="messagesContainer">
        <div 
          v-for="message in currentMessages" 
          :key="message.id"
          :class="['message', getMessageClass(message)]"
        >
          <div class="message-content" :class="message.message_type">
            <p v-if="message.message_type === 'text'">{{ message.content }}</p>
            
            <div v-else-if="message.message_type === 'image'" class="image-container">
              <img 
                :src="message.file_url" 
                :alt="message.file_name || 'Chat image'"
                @click="openImagePreview(message.file_url)"
              >
              <p v-if="message.content" class="image-caption">{{ message.content }}</p>
            </div>

            <div v-else-if="message.message_type === 'file'" class="file-container">
              <a :href="message.file_url" target="_blank" class="file-download">
                <i class="fas fa-file"></i>
                <span>{{ message.file_name }}</span>
              </a>
            </div>

            <span class="message-time">{{ formatTime(message.created_at) }}</span>
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
            @change="handleFileUpload" 
            style="display: none"
            accept="image/*,.pdf,.doc,.docx"
          >
        </div>

        <textarea
          v-model="newMessage"
          @keyup.enter.prevent="sendMessage"
          placeholder="Type your message..."
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

    <div class="no-chat-selected" v-else>
      <i class="fas fa-comments"></i>
      <p>Select a chat session to start messaging</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { 
  fetchAllSessions,
  subscribeToNewSessions,
  fetchSessionMessages,
  subscribeToSessionMessages,
  sendMessage,
  updateSessionStatus,
  markMessageAsRead
} from '@/supabase';
import { formatTime } from '@/utils/formatters';
import { uploadFile } from '@/utils/fileUpload';

export default {
  name: 'AdminChat',
  
  setup() {
    const sessions = ref([]);
    const currentSession = ref(null);
    const currentMessages = ref([]);
    const newMessage = ref('');
    const messagesContainer = ref(null);
    const fileInput = ref(null);
    const selectedFile = ref(null);
    let sessionSubscription = null;
    let messageSubscription = null;

    const loadSessions = async () => {
      try {
        const { data, error } = await fetchAllSessions();
        if (error) throw error;
        sessions.value = data;
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    };

    const selectSession = async (session) => {
      currentSession.value = session;
      
      try {
        const { data, error } = await fetchSessionMessages(session.id);
        if (error) throw error;
        currentMessages.value = data;
        
        // Unsubscribe from previous session if any
        if (messageSubscription) {
          messageSubscription.unsubscribe();
        }
        
        // Subscribe to new session messages
        messageSubscription = subscribeToSessionMessages(session.id, (newMsg) => {
          currentMessages.value.push(newMsg);
          scrollToBottom();
          if (newMsg.sender_type === 'customer') {
            markMessageAsRead(newMsg.id);
          }
        });
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    const closeSession = async () => {
      if (!currentSession.value) return;
      
      try {
        await updateSessionStatus(currentSession.value.id, 'closed');
        currentSession.value.status = 'closed';
      } catch (error) {
        console.error('Error closing session:', error);
      }
    };

    const handleSendMessage = async (content, type = 'text', fileUrl = null) => {
      if (!currentSession.value) return;
      
      try {
        const { error } = await sendMessage({
          content,
          sessionId: currentSession.value.id,
          senderType: 'admin',
          messageType: type,
          fileUrl
        });
        if (error) throw error;
        newMessage.value = '';
      } catch (error) {
        console.error('Error sending message:', error);
      }
    };

    const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file || !currentSession.value) return;

      selectedFile.value = file;
      try {
        const { fileUrl, error } = await uploadFile(file, currentSession.value.id);
        if (error) throw error;

        await handleSendMessage(
          file.name,
          file.type.startsWith('image/') ? 'image' : 'file',
          fileUrl
        );
      } catch (error) {
        console.error('File upload error:', error);
      } finally {
        selectedFile.value = null;
        if (fileInput.value) fileInput.value.value = '';
      }
    };

    const scrollToBottom = () => {
      if (messagesContainer.value) {
        setTimeout(() => {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }, 100);
      }
    };

    const getMessageClass = (message) => ({
      'admin-message': message.sender_type === 'admin',
      'customer-message': message.sender_type === 'customer',
      'system-message': message.sender_type === 'system'
    });

    onMounted(() => {
      loadSessions();
      sessionSubscription = subscribeToNewSessions((newSession) => {
        const index = sessions.value.findIndex(s => s.id === newSession.id);
        if (index >= 0) {
          sessions.value[index] = { ...sessions.value[index], ...newSession };
        } else {
          sessions.value.unshift(newSession);
        }
      });
    });

    onUnmounted(() => {
      if (sessionSubscription) {
        sessionSubscription.unsubscribe();
      }
      if (messageSubscription) {
        messageSubscription.unsubscribe();
      }
    });

    watch(currentMessages, () => {
      scrollToBottom();
    });

    return {
      sessions,
      currentSession,
      currentMessages,
      newMessage,
      messagesContainer,
      fileInput,
      selectedFile,
      formatTime,
      selectSession,
      closeSession,
      handleSendMessage,
      handleFileUpload,
      getMessageClass,
      scrollToBottom
    };
  }
};
</script>

<style lang="scss" scoped>
.admin-chat {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1rem;
  height: 100%;
  background: #1a1a1a;
  padding: 1rem;
  border-radius: 12px;
  overflow: hidden;

  .chat-sessions {
    background: #2d2d2d;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    
    h2 {
      color: #fff;
      margin: 0 0 1rem 0;
      font-size: 1.2rem;
    }

    .sessions-list {
      overflow-y: auto;
      flex: 1;

      .session-item {
        padding: 1rem;
        background: #333;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        cursor: pointer;
        transition: background-color 0.3s ease;

        &:hover {
          background: #424242;
        }

        &.active {
          background: #1976D2;
        }

        .session-info {
          h3 {
            color: #fff;
            margin: 0;
            font-size: 1rem;
          }

          p {
            color: #888;
            margin: 0.5rem 0 0 0;
            font-size: 0.9rem;
          }
        }

        .session-meta {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          font-size: 0.8rem;

          .message-count {
            color: #888;
          }

          .session-status {
            &.active {
              color: #4CAF50;
            }
            &.closed {
              color: #f44336;
            }
          }
        }
      }
    }
  }

  .chat-window {
    display: flex;
    flex-direction: column;
    background: #2d2d2d;
    border-radius: 8px;
    overflow: hidden;

    .chat-header {
      padding: 1rem;
      background: #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #444;

      .user-info {
        h3 {
          color: #fff;
          margin: 0;
        }

        .user-status {
          font-size: 0.9rem;
          color: #888;
        }
      }

      .actions {
        button {
          background: #f44336;
          color: #fff;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s ease;

          &:hover {
            background: #d32f2f;
          }
        }
      }
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .message {
        max-width: 80%;

        &.admin-message {
          align-self: flex-end;
          .message-content {
            background: #1976D2;
            border-radius: 12px 12px 0 12px;
          }
        }

        &.customer-message {
          align-self: flex-start;
          .message-content {
            background: #424242;
            border-radius: 12px 12px 12px 0;
          }
        }

        .message-content {
          padding: 0.8rem 1rem;
          color: #fff;

          p {
            margin: 0;
            word-break: break-word;
          }

          .message-time {
            display: block;
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.7);
            margin-top: 0.4rem;
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
            }
          }
        }
      }
    }

    .chat-input {
      padding: 1rem;
      background: #333;
      display: flex;
      gap: 0.5rem;
      align-items: center;
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

  .no-chat-selected {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: #2d2d2d;
    border-radius: 8px;
    color: #888;

    i {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    p {
      font-size: 1.2rem;
    }
  }
}

// Scrollbar styling
.messages, .sessions-list {
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
