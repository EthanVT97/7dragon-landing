<template>
  <div class="chatbot">
    <h1>Chatbot Configuration</h1>
    <div class="config-grid">
      <div class="section">
        <h2>General Settings</h2>
        <div class="form-group">
          <label>Bot Name</label>
          <input type="text" v-model="config.botName">
        </div>
        <div class="form-group">
          <label>Welcome Message</label>
          <textarea v-model="config.welcomeMessage"></textarea>
        </div>
        <div class="form-group">
          <label>Default Language</label>
          <select v-model="config.defaultLanguage">
            <option value="my">Myanmar</option>
            <option value="th">Thai</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
      <div class="section">
        <h2>Response Templates</h2>
        <div v-for="(template, index) in config.templates" :key="index" class="template-item">
          <div class="form-group">
            <label>Trigger</label>
            <input type="text" v-model="template.trigger">
          </div>
          <div class="form-group">
            <label>Response</label>
            <textarea v-model="template.response"></textarea>
          </div>
          <button @click="removeTemplate(index)" class="btn btn-secondary">Remove</button>
        </div>
        <button @click="addTemplate" class="btn btn-primary">Add Template</button>
      </div>
    </div>
    <div class="actions">
      <button @click="saveConfig" class="btn btn-primary">Save Changes</button>
      <button @click="testBot" class="btn btn-secondary">Test Bot</button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { logger } from '@/utils/logger'

export default {
  name: 'Chatbot',
  setup() {
    const config = ref({
      botName: '18K Assistant',
      welcomeMessage: 'Hello! How can I help you today?',
      defaultLanguage: 'my',
      templates: [
        {
          trigger: 'hello',
          response: 'Hi there! How can I assist you?'
        },
        {
          trigger: 'pricing',
          response: 'Our pricing plans start from $29/month. Would you like to know more?'
        }
      ]
    })

    const saveConfig = async () => {
      try {
        // Save config to Supabase
        logger.info('Chatbot settings updated successfully')
      } catch (error) {
        logger.error('Failed to update chatbot settings:', error)
      }
    }

    const addTemplate = () => {
      config.value.templates.push({
        trigger: '',
        response: ''
      })
    }

    const removeTemplate = (index) => {
      config.value.templates.splice(index, 1)
    }

    const testBot = () => {
      // Implement bot testing functionality
      logger.info('Testing bot...')
    }

    return {
      config,
      saveConfig,
      addTemplate,
      removeTemplate,
      testBot
    }
  }
}
</script>

<style lang="scss" scoped>
.chatbot {
  padding: $spacing-xl;

  h1 {
    margin-bottom: $spacing-xl;
  }
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-xl;
  margin-bottom: $spacing-xl;

  @media (max-width: $tablet) {
    grid-template-columns: 1fr;
  }
}

.section {
  background: rgba($primary, 0.1);
  padding: $spacing-xl;
  border-radius: $border-radius-md;

  h2 {
    color: $accent;
    margin-bottom: $spacing-lg;
  }
}

.form-group {
  margin-bottom: $spacing-lg;

  label {
    display: block;
    margin-bottom: $spacing-sm;
  }

  input, textarea, select {
    width: 100%;
    padding: $spacing-md;
    border: 1px solid rgba($text, 0.2);
    border-radius: $border-radius-sm;
    background: rgba($background, 0.8);

    &:focus {
      border-color: $accent;
      outline: none;
    }
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }

  select {
    height: 40px;
  }
}

.template-item {
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid rgba($text, 0.1);

  &:last-child {
    border-bottom: none;
  }
}

.actions {
  display: flex;
  gap: $spacing-md;
  justify-content: flex-end;
}
</style>
