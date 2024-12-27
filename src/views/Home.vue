<template>
  <div class="home">
    <h1>Welcome to 18K Chat</h1>
    <div class="hero">
      <img src="@/assets/18kchatlogo.jpg" alt="18K Chat Logo" class="logo">
      <p class="tagline">Your Modern Customer Service Solution</p>
    </div>
    <div class="features">
      <div class="feature">
        <h3>Real-time Chat</h3>
        <p>Connect with your customers instantly</p>
      </div>
      <div class="feature">
        <h3>Multi-language Support</h3>
        <p>Communicate in Myanmar, Thai, and English</p>
      </div>
      <div class="feature">
        <h3>Smart Automation</h3>
        <p>AI-powered responses for quick support</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<style lang="scss" scoped>
.home {
  padding: $spacing-xl;
  text-align: center;
}

.hero {
  margin: $spacing-xl 0;

  .logo {
    max-width: 200px;
    border-radius: $border-radius-lg;
  }

  .tagline {
    font-size: $font-size-xl;
    color: $accent;
    margin-top: $spacing-md;
  }
}

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-lg;
  margin-top: $spacing-xl;

  @media (max-width: $mobile) {
    grid-template-columns: 1fr;
  }

  .feature {
    padding: $spacing-lg;
    background: rgba($primary, 0.1);
    border-radius: $border-radius-md;
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-5px);
    }

    h3 {
      color: $accent;
      margin-bottom: $spacing-sm;
    }
  }
}
</style>
