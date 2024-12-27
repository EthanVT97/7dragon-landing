<template>
  <div id="app" :class="{ 'dark-theme': isDarkMode }">
    <nav class="nav-menu" v-if="!isAdminRoute">
      <router-link to="/" class="nav-link">{{ $t('nav.home') }}</router-link>
      <router-link to="/pricing" class="nav-link">{{ $t('nav.pricing') }}</router-link>
      <router-link to="/about" class="nav-link">{{ $t('nav.about') }}</router-link>
      <router-link to="/login" class="nav-link login-link">{{ $t('nav.login') }}</router-link>
      
      <div class="language-switcher">
        <button 
          v-for="lang in languages" 
          :key="lang.code"
          @click="changeLanguage(lang.code)"
          :class="{ active: currentLanguage === lang.code }"
          class="lang-btn"
        >
          {{ lang.name }}
        </button>
      </div>
    </nav>

    <router-view></router-view>

    <!-- Chat Widget -->
    <div v-if="!isAdminRoute" class="chat-widget" :class="{ 'chat-open': isChatOpen }">
      <button @click="toggleChat" class="chat-toggle">
        <i class="fas" :class="isChatOpen ? 'fa-times' : 'fa-comments'"></i>
      </button>
      <chat-window v-if="isChatOpen" />
    </div>
  </div>
</template>

<script>
import ChatWindow from '@/components/ChatWindow.vue'
import { mapState, mapActions } from 'vuex'

export default {
  name: 'App',
  components: {
    ChatWindow
  },
  data() {
    return {
      isChatOpen: false,
      languages: [
        { code: 'my', name: 'မြန်မာ' },
        { code: 'th', name: 'ไทย' },
        { code: 'en', name: 'ENG' }
      ]
    }
  },
  computed: {
    ...mapState(['isDarkMode', 'currentLanguage']),
    isAdminRoute() {
      return this.$route.path.startsWith('/admin')
    }
  },
  methods: {
    ...mapActions(['setLanguage']),
    toggleChat() {
      this.isChatOpen = !this.isChatOpen
    },
    changeLanguage(lang) {
      this.setLanguage(lang)
      this.$i18n.locale = lang
    }
  }
}
</script>

<style lang="scss">
:root {
  --color-background: #000000;
  --color-primary: #4B0082;
  --color-secondary: #008080;
  --color-accent: #00FF7F;
  --color-highlight: #00FFFF;
  --color-text: #FFFFE0;
}

#app {
  font-family: 'Noto Sans Myanmar', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--color-background);
  color: var(--color-text);
  min-height: 100vh;
}

.nav-menu {
  background-color: var(--color-primary);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 255, 127, 0.2);
}

.nav-link {
  color: var(--color-text);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    background-color: var(--color-secondary);
    color: var(--color-highlight);
  }

  &.router-link-active {
    background-color: var(--color-accent);
    color: var(--color-background);
  }
}

.login-link {
  background-color: var(--color-accent);
  color: var(--color-background);
  font-weight: bold;

  &:hover {
    background-color: var(--color-highlight);
  }
}

.language-switcher {
  display: flex;
  gap: 0.5rem;
}

.lang-btn {
  background: none;
  border: 1px solid var(--color-text);
  color: var(--color-text);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: var(--color-secondary);
  }

  &.active {
    background-color: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-background);
  }
}

.chat-widget {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
}

.chat-toggle {
  background-color: var(--color-accent);
  color: var(--color-background);
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 255, 127, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    background-color: var(--color-highlight);
  }
}

.chat-open .chat-toggle {
  background-color: var(--color-secondary);
}

// Global Animations
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Responsive Design
@media (max-width: 768px) {
  .nav-menu {
    flex-direction: column;
    gap: 1rem;
  }

  .language-switcher {
    margin-top: 1rem;
  }

  .chat-widget {
    bottom: 1rem;
    right: 1rem;
  }
}
</style>
