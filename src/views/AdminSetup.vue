<template>
  <div class="admin-setup">
    <h1>Admin Setup</h1>
    <div class="setup-card">
      <div v-if="!setupComplete">
        <p>Click the button below to create the initial admin user:</p>
        <p class="credentials">
          Email: admin@18kchat.com<br>
          Password: Admin@18k2024
        </p>
        <button @click="runSetup" :disabled="isLoading" class="setup-button">
          {{ isLoading ? 'Creating Admin...' : 'Create Admin User' }}
        </button>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>
      <div v-else>
        <div class="success-message">
          <i class="fas fa-check-circle"></i>
          <h2>Setup Complete!</h2>
          <p>Admin user has been created successfully.</p>
          <p>You can now log in with the credentials above.</p>
          <button @click="goToLogin" class="login-link">Go to Login</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createInitialAdmin } from '@/utils/createInitialAdmin.mjs'
import { logger } from '@/utils/logger'

export default {
  name: 'AdminSetup',
  setup() {
    const router = useRouter()
    const isLoading = ref(false)
    const setupComplete = ref(false)
    const errorMessage = ref('')

    const runSetup = async () => {
      isLoading.value = true
      errorMessage.value = ''
      
      try {
        const { error, success } = await createInitialAdmin()
        if (error) {
          console.error('Setup failed:', error)
          if (error.type === 'ADMIN_EXISTS') {
            setupComplete.value = true
          } else {
            errorMessage.value = error.message || 'Failed to create admin user'
            if (error.details) {
              console.error('Error details:', error.details)
            }
          }
        } else if (success) {
          logger.info('Admin setup completed')
          setupComplete.value = true
        } else {
          errorMessage.value = 'Failed to create admin user for an unknown reason'
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        errorMessage.value = 'An unexpected error occurred. Please check your environment configuration.'
      } finally {
        isLoading.value = false
      }
    }

    const goToLogin = () => {
      router.push('/login')
    }

    return {
      isLoading,
      setupComplete,
      errorMessage,
      runSetup,
      goToLogin
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-setup {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-primary) 100%);
  color: var(--color-text);
}

.setup-card {
  background: rgba(26, 42, 61, 0.9);
  border: 1px solid rgba(82, 215, 183, 0.3);
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.credentials {
  background: rgba(15, 28, 44, 0.8);
  padding: 1rem;
  border-radius: 8px;
  margin: 1.5rem 0;
  font-family: monospace;
  border: 1px solid rgba(82, 215, 183, 0.3);
}

.setup-button {
  background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-accent) 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(82, 215, 183, 0.3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.success-message {
  color: var(--color-secondary);
  margin-bottom: 2rem;
  
  i {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  h2 {
    margin: 1rem 0;
  }
  
  p {
    color: var(--color-text);
    margin: 0.5rem 0;
  }
}

.login-link {
  display: inline-block;
  background: rgba(82, 215, 183, 0.1);
  color: var(--color-secondary);
  text-decoration: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--color-secondary);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(82, 215, 183, 0.2);
    transform: translateY(-2px);
  }
}

.error-message {
  color: var(--color-error);
  margin-top: 1rem;
}
</style>
