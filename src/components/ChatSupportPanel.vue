<template>
  <div class="chat-support-panel">
    <!-- Availability Indicator -->
    <div class="availability-indicator" :class="{ 'is-online': isOnline }">
      <span class="status-dot"></span>
      <span class="status-text">{{ isOnline ? '24/7 Support Online' : 'Offline' }}</span>
    </div>

    <!-- Quick Response Templates -->
    <div class="quick-responses">
      <div class="category-tabs">
        <button 
          v-for="(responses, category) in quickResponses" 
          :key="category"
          @click="activeCategory = category"
          :class="{ active: activeCategory === category }"
          class="category-tab"
        >
          {{ category }}
        </button>
      </div>

      <div class="responses-list">
        <button
          v-for="response in quickResponses[activeCategory]"
          :key="response.id"
          @click="sendQuickResponse(response)"
          class="response-button"
          :class="{ 'emergency': response.isEmergency }"
        >
          {{ response.title }}
        </button>
      </div>
    </div>

    <!-- Emergency Support Trigger -->
    <div class="emergency-support" v-if="showEmergencyPanel">
      <h3>Emergency Support</h3>
      <div class="emergency-actions">
        <button @click="triggerEmergencySupport" class="emergency-button">
          🚨 Request Emergency Support
        </button>
        <button @click="triggerSelfExclusion" class="self-exclusion-button">
          ⚠️ Self-Exclusion
        </button>
      </div>
    </div>

    <!-- Chat Export -->
    <div class="chat-export">
      <button @click="exportChatTranscript" class="export-button">
        📥 Export Chat History
      </button>
      <div class="export-options" v-if="showExportOptions">
        <button @click="exportAs('pdf')">PDF</button>
        <button @click="exportAs('txt')">Text</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { quickResponses } from '../data/quickResponses'
import { useStore } from 'vuex'

export default {
  name: 'ChatSupportPanel',
  
  setup() {
    const store = useStore()
    const activeCategory = ref('general')
    const showEmergencyPanel = ref(false)
    const showExportOptions = ref(false)
    const isOnline = ref(true)

    // Check support availability every minute
    const availabilityCheck = setInterval(() => {
      checkSupportAvailability()
    }, 60000)

    onMounted(() => {
      checkSupportAvailability()
    })

    onUnmounted(() => {
      clearInterval(availabilityCheck)
    })

    const checkSupportAvailability = async () => {
      try {
        const response = await fetch('/api/support/status')
        const { online } = await response.json()
        isOnline.value = online
      } catch (error) {
        console.error('Failed to check support status:', error)
      }
    }

    const sendQuickResponse = (response) => {
      if (response.isEmergency) {
        showEmergencyPanel.value = true
      }
      
      store.dispatch('chat/sendMessage', {
        content: response.content,
        type: 'quick-response',
        metadata: {
          templateId: response.id,
          category: activeCategory.value
        }
      })
    }

    const triggerEmergencySupport = async () => {
      await store.dispatch('chat/triggerEmergencySupport')
      showEmergencyPanel.value = true
    }

    const triggerSelfExclusion = async () => {
      await store.dispatch('chat/triggerSelfExclusion')
    }

    const exportChatTranscript = () => {
      showExportOptions.value = !showExportOptions.value
    }

    const exportAs = async (format) => {
      try {
        const response = await fetch(`/api/chat/export/${format}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chatId: store.state.chat.currentChatId
          })
        })

        if (format === 'pdf') {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `chat-transcript-${new Date().toISOString()}.pdf`
          a.click()
        } else {
          const text = await response.text()
          const blob = new Blob([text], { type: 'text/plain' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `chat-transcript-${new Date().toISOString()}.txt`
          a.click()
        }

        showExportOptions.value = false
      } catch (error) {
        console.error('Failed to export chat:', error)
      }
    }

    return {
      quickResponses,
      activeCategory,
      showEmergencyPanel,
      showExportOptions,
      isOnline,
      sendQuickResponse,
      triggerEmergencySupport,
      triggerSelfExclusion,
      exportChatTranscript,
      exportAs
    }
  }
}
</script>

<style lang="scss" scoped>
.chat-support-panel {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .availability-indicator {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0.5rem;
    border-radius: 4px;
    background: var(--bg-primary);

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 0.5rem;
      background: #ff4444;

      .is-online & {
        background: #00C851;
      }
    }

    .status-text {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
  }

  .category-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;

    .category-tab {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      background: var(--bg-primary);
      color: var(--text-primary);
      cursor: pointer;
      white-space: nowrap;

      &.active {
        background: var(--color-primary);
        color: white;
      }
    }
  }

  .responses-list {
    display: grid;
    gap: 0.5rem;
    margin-bottom: 1rem;

    .response-button {
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: white;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: var(--bg-hover);
      }

      &.emergency {
        border-color: #ff4444;
        color: #ff4444;
      }
    }
  }

  .emergency-support {
    margin-bottom: 1rem;
    padding: 1rem;
    background: #fff3cd;
    border: 1px solid #ffeeba;
    border-radius: 4px;

    h3 {
      color: #856404;
      margin-bottom: 0.5rem;
    }

    .emergency-actions {
      display: flex;
      gap: 0.5rem;

      button {
        flex: 1;
        padding: 0.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;

        &.emergency-button {
          background: #ff4444;
          color: white;
        }

        &.self-exclusion-button {
          background: #ffbb33;
          color: white;
        }
      }
    }
  }

  .chat-export {
    position: relative;

    .export-button {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: white;
      cursor: pointer;

      &:hover {
        background: var(--bg-hover);
      }
    }

    .export-options {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      margin-top: 0.5rem;
      z-index: 10;

      button {
        width: 100%;
        padding: 0.5rem;
        border: none;
        background: none;
        cursor: pointer;

        &:hover {
          background: var(--bg-hover);
        }
      }
    }
  }
}
</style>
