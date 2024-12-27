<template>
  <div class="login">
    <div class="login-container">
      <img src="@/assets/18kchatlogo.jpg" alt="18K Chat Logo" class="logo">
      <h1>Welcome Back</h1>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            placeholder="Enter your email"
          >
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            placeholder="Enter your password"
          >
        </div>
        <button type="submit" class="btn btn-primary">Login</button>
      </form>
      <p class="error" v-if="error">{{ error }}</p>
      <div class="links">
        <a href="#" @click.prevent="forgotPassword">Forgot Password?</a>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const store = useStore()
    const email = ref('')
    const password = ref('')
    const error = ref('')

    const handleLogin = async () => {
      try {
        await store.dispatch('auth/login', {
          email: email.value,
          password: password.value
        })
        router.push('/admin/dashboard')
      } catch (err) {
        error.value = 'Invalid email or password'
      }
    }

    const forgotPassword = () => {
      // Implement password reset functionality
      console.log('Password reset requested')
    }

    return {
      email,
      password,
      error,
      handleLogin,
      forgotPassword
    }
  }
}
</script>

<style lang="scss" scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
  background: linear-gradient(135deg, $background, darken($background, 10%));
}

.login-container {
  background: rgba($primary, 0.1);
  padding: $spacing-xl;
  border-radius: $border-radius-lg;
  width: 100%;
  max-width: 400px;
  backdrop-filter: blur(10px);
  text-align: center;

  .logo {
    width: 100px;
    margin-bottom: $spacing-lg;
    border-radius: $border-radius-md;
  }

  h1 {
    margin-bottom: $spacing-xl;
    color: $accent;
  }
}

.login-form {
  .form-group {
    margin-bottom: $spacing-lg;
    text-align: left;

    label {
      display: block;
      margin-bottom: $spacing-sm;
    }

    input {
      width: 100%;
      padding: $spacing-md;
      border: 1px solid rgba($text, 0.2);
      border-radius: $border-radius-md;
      background: rgba($background, 0.8);
      color: $text;

      &:focus {
        border-color: $accent;
        outline: none;
      }
    }
  }

  button {
    width: 100%;
    margin-top: $spacing-lg;
  }
}

.error {
  color: #ff4444;
  margin-top: $spacing-md;
}

.links {
  margin-top: $spacing-lg;

  a {
    color: $accent;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
