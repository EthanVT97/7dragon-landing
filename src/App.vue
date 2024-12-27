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
  --color-background: #0f1c2c;
  --color-primary: #1a2a3d;
  --color-secondary: #52d7b7;
  --color-accent: #3eaf7c;
  --color-highlight: #7ce7ff;
  --color-text: #e0e7ff;
}

#app {
  font-family: 'Noto Sans Myanmar', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-primary) 100%);
  color: var(--color-text);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.nav-menu {
  background: rgba(26, 42, 61, 0.9);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 15px rgba(82, 215, 183, 0.2);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(82, 215, 183, 0.3);
}

.nav-link {
  color: var(--color-text);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    color: var(--color-secondary);
    background: rgba(82, 215, 183, 0.1);
  }
  
  &.router-link-active {
    color: var(--color-secondary);
    background: rgba(82, 215, 183, 0.15);
    
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 2px;
      background: var(--color-secondary);
      border-radius: 2px;
    }
  }
}

.login-link {
  background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-accent) 100%);
  color: #fff;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-weight: 500;
  
  &:hover {
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(82, 215, 183, 0.3);
  }
}

.language-switcher {
  display: flex;
  gap: 0.5rem;
  
  .lang-btn {
    background: transparent;
    border: 1px solid rgba(82, 215, 183, 0.3);
    color: var(--color-text);
    padding: 0.4rem 0.8rem;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(82, 215, 183, 0.1);
    }
    
    &.active {
      background: rgba(82, 215, 183, 0.2);
      color: var(--color-secondary);
      border-color: var(--color-secondary);
    }
  }
}

.chat-widget {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  
  .chat-toggle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-accent) 100%);
    border: none;
    color: white;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(82, 215, 183, 0.3);
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(82, 215, 183, 0.4);
    }
    
    i {
      font-size: 1.5rem;
    }
  }
}

// Animation for chat window
.chat-widget {
  .chat-window {
    position: fixed;
    bottom: 80px;
    right: 2rem;
    width: 380px;
    height: 600px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease-out;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Media Queries
@media (max-width: 768px) {
  .nav-menu {
    padding: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .language-switcher {
    width: 100%;
    justify-content: center;
    order: 2;
  }
  
  .chat-widget .chat-window {
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
