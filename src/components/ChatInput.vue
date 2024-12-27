<template>
  <div class="chat-input">
    <div class="input-container">
      <textarea
        v-model="message"
        @keydown.enter.prevent="sendMessage"
        placeholder="Type a message..."
        :disabled="isLoading"
        ref="messageInput"
      ></textarea>
      
      <div class="actions">
        <label class="upload-button" :class="{ disabled: isLoading }">
          <input
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            :disabled="isLoading"
            class="hidden"
          />
          <i class="fas fa-image"></i>
        </label>
        
        <button 
          @click="sendMessage" 
          :disabled="isLoading || (!message && !selectedFile)"
          class="send-button"
        >
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>

    <div v-if="selectedFile" class="file-preview">
      <div class="preview-content">
        <img 
          v-if="filePreview" 
          :src="filePreview" 
          alt="Selected image"
          class="image-preview" 
        />
        <div class="file-info">
          <span>{{ selectedFile.name }}</span>
          <button @click="clearFile" class="clear-file">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { uploadChatImage } from '@/utils/fileUpload'
import { useStore } from 'vuex'

export default {
  name: 'ChatInput',
  props: {
    sessionId: {
      type: String,
      required: true
    }
  },
  
  setup(props) {
    const store = useStore()
    const message = ref('')
    const isLoading = ref(false)
    const error = ref('')
    const selectedFile = ref(null)
    const filePreview = ref('')
    const messageInput = ref(null)

    const clearFile = () => {
      selectedFile.value = null
      filePreview.value = ''
    }

    const handleImageUpload = (event) => {
      const file = event.target.files[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        error.value = 'Please select an image file'
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        error.value = 'Image size should be less than 5MB'
        return
      }

      selectedFile.value = file
      const reader = new FileReader()
      reader.onload = e => {
        filePreview.value = e.target.result
      }
      reader.readAsDataURL(file)
      error.value = ''
    }

    const sendMessage = async () => {
      if (isLoading.value) return
      if (!message.value && !selectedFile.value) return
      
      error.value = ''
      isLoading.value = true

      try {
        if (selectedFile.value) {
          // Upload image
          const { data, error: uploadError } = await uploadChatImage(
            selectedFile.value,
            props.sessionId,
            store.state.user.id
          )

          if (uploadError) throw uploadError

          // Add optional message if provided
          if (message.value) {
            await store.dispatch('sendMessage', {
              sessionId: props.sessionId,
              content: message.value,
              type: 'text'
            })
          }
        } else {
          // Send text message
          await store.dispatch('sendMessage', {
            sessionId: props.sessionId,
            content: message.value,
            type: 'text'
          })
        }

        // Clear input
        message.value = ''
        clearFile()
        messageInput.value?.focus()
      } catch (err) {
        console.error('Error sending message:', err)
        error.value = 'Failed to send message. Please try again.'
      } finally {
        isLoading.value = false
      }
    }

    onMounted(() => {
      messageInput.value?.focus()
    })

    return {
      message,
      isLoading,
      error,
      selectedFile,
      filePreview,
      messageInput,
      handleImageUpload,
      sendMessage,
      clearFile
    }
  }
}
</script>

<style lang="scss" scoped>
.chat-input {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-color);

  .input-container {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;

    textarea {
      flex: 1;
      min-height: 40px;
      max-height: 120px;
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      resize: vertical;
      background: var(--input-bg);
      color: var(--text-color);

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }
  }

  .upload-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: var(--primary-color);
    color: white;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.9;
    }

    &.disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    input {
      display: none;
    }
  }

  .send-button {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 8px;
    background: var(--primary-color);
    color: white;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  .file-preview {
    margin-top: 1rem;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--input-bg);

    .preview-content {
      display: flex;
      align-items: center;
      gap: 1rem;

      .image-preview {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
      }

      .file-info {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;

        .clear-file {
          padding: 0.25rem;
          border: none;
          background: none;
          color: var(--text-color);
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;

          &:hover {
            opacity: 1;
          }
        }
      }
    }
  }

  .error-message {
    margin-top: 0.5rem;
    color: var(--color-error);
    font-size: 0.875rem;
  }
}
</style>
