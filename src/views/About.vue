<template>
  <div class="about-page">
    <div class="about-content">
      <h1>About 18K Chat</h1>
      <div class="description">
        <p>Welcome to 18K Chat, your premier destination for intelligent conversations and seamless communication.</p>
        <p>Our platform leverages cutting-edge AI technology to provide you with a unique and engaging chat experience.</p>
      </div>
      <div class="features">
        <h2>Key Features</h2>
        <ul>
          <li>Real-time AI-powered conversations</li>
          <li>Secure and private messaging</li>
          <li>Intuitive user interface</li>
          <li>24/7 availability</li>
        </ul>
      </div>
      <div class="version-info">
        <p>Version: 1.0.0</p>
        <p> 2024 18K Chat. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'About'
}
</script>

<style lang="scss" scoped>
.about-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;

  .about-content {
    background: #ffffff;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    h1 {
      color: #2c3e50;
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .description {
      margin-bottom: 2rem;
      
      p {
        margin-bottom: 1rem;
        line-height: 1.6;
        color: #34495e;
      }
    }

    .features {
      margin-bottom: 2rem;

      h2 {
        color: #2c3e50;
        margin-bottom: 1rem;
      }

      ul {
        list-style-type: none;
        padding: 0;

        li {
          margin-bottom: 0.5rem;
          padding-left: 1.5rem;
          position: relative;
          color: #34495e;

          &:before {
            content: "•";
            color: #3498db;
            position: absolute;
            left: 0;
          }
        }
      }
    }

    .version-info {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
      color: #7f8c8d;

      p {
        margin: 0.5rem 0;
        font-size: 0.9rem;
      }
    }
  }
}
</style>
