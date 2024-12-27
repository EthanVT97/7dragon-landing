&lt;template>
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
      </div>
      <div v-else>
        <div class="success-message">
          <i class="fas fa-check-circle"></i>
          <h2>Setup Complete!</h2>
          <p>Admin user has been created successfully.</p>
          <p>You can now log in with the credentials above.</p>
        </div>
        <router-link to="/login" class="login-link">Go to Login</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { createInitialAdmin } from '@/utils/createInitialAdmin'

export default {
  name: 'AdminSetup',
  setup() {
    const isLoading = ref(false)
    const setupComplete = ref(false)

    const runSetup = async () => {
      isLoading.value = true
      try {
        const { error } = await createInitialAdmin()
        if (error) {
          console.error('Setup failed:', error)
          alert('Failed to create admin user. Check console for details.')
        } else {
          setupComplete.value = true
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        alert('An unexpected error occurred. Check console for details.')
      } finally {
        isLoading.value = false
      }
    }

    return {
      isLoading,
      setupComplete,
      runSetup
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
</style>
