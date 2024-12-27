<template>
  <div class="content-management">
    <h1>Content Management</h1>
    <div class="content-grid">
      <div class="section">
        <h2>Landing Page</h2>
        <div class="form-group">
          <label>Hero Title</label>
          <input type="text" v-model="content.hero.title">
        </div>
        <div class="form-group">
          <label>Hero Description</label>
          <textarea v-model="content.hero.description"></textarea>
        </div>
        <button @click="saveContent" class="btn btn-primary">Save Changes</button>
      </div>
      <div class="section">
        <h2>Features</h2>
        <div v-for="(feature, index) in content.features" :key="index" class="feature-item">
          <div class="form-group">
            <label>Title</label>
            <input type="text" v-model="feature.title">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="feature.description"></textarea>
          </div>
        </div>
        <button @click="addFeature" class="btn btn-secondary">Add Feature</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'Content',
  setup() {
    const content = ref({
      hero: {
        title: 'Welcome to 18K Chat',
        description: 'Your Modern Customer Service Solution'
      },
      features: [
        {
          title: 'Real-time Chat',
          description: 'Connect with your customers instantly'
        },
        {
          title: 'Multi-language Support',
          description: 'Communicate in Myanmar, Thai, and English'
        }
      ]
    })

    const saveContent = async () => {
      // Save content to Supabase
      console.log('Saving content:', content.value)
    }

    const addFeature = () => {
      content.value.features.push({
        title: '',
        description: ''
      })
    }

    return {
      content,
      saveContent,
      addFeature
    }
  }
}
</script>

<style lang="scss" scoped>
.content-management {
  padding: $spacing-xl;

  h1 {
    margin-bottom: $spacing-xl;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-xl;

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

  input, textarea {
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
}

.feature-item {
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid rgba($text, 0.1);

  &:last-child {
    border-bottom: none;
  }
}
</style>
