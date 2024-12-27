<template>
  <div class="about">
    <h1>About 18K Chat</h1>
    <div class="content">
      <div class="mission">
        <h2>Our Mission</h2>
        <p>To provide businesses with intelligent, multilingual customer service solutions that enhance customer experience and streamline support operations.</p>
      </div>
      <div class="values">
        <h2>Our Values</h2>
        <div class="values-grid">
          <div class="value">
            <h3>Innovation</h3>
            <p>Constantly improving our AI and chat solutions</p>
          </div>
          <div class="value">
            <h3>Reliability</h3>
            <p>24/7 uptime and consistent performance</p>
          </div>
          <div class="value">
            <h3>Security</h3>
            <p>Enterprise-grade data protection</p>
          </div>
          <div class="value">
            <h3>Support</h3>
            <p>Dedicated customer success team</p>
          </div>
        </div>
      </div>
      <div class="team">
        <h2>Our Team</h2>
        <div class="team-grid">
          <div class="member">
            <img src="@/assets/18kchatlogo.jpg" alt="Team Member" class="avatar">
            <h3>John Doe</h3>
            <p>CEO & Founder</p>
          </div>
          <div class="member">
            <img src="@/assets/18kchatlogo.jpg" alt="Team Member" class="avatar">
            <h3>Jane Smith</h3>
            <p>CTO</p>
          </div>
        </div>
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
.about {
  padding: $spacing-xl;

  h1 {
    text-align: center;
    margin-bottom: $spacing-xl;
  }
}

.content {
  max-width: 1200px;
  margin: 0 auto;

  > div {
    margin-bottom: $spacing-xl;
  }
}

.mission {
  text-align: center;
  max-width: 800px;
  margin: 0 auto $spacing-xl;

  p {
    font-size: $font-size-lg;
  }
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-lg;

  @media (max-width: $tablet) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: $mobile) {
    grid-template-columns: 1fr;
  }
}

.value {
  padding: $spacing-lg;
  background: rgba($primary, 0.1);
  border-radius: $border-radius-md;
  text-align: center;

  h3 {
    color: $accent;
    margin-bottom: $spacing-sm;
  }
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-xl;
  max-width: 800px;
  margin: 0 auto;

  @media (max-width: $mobile) {
    grid-template-columns: 1fr;
  }
}

.member {
  text-align: center;

  .avatar {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    margin-bottom: $spacing-md;
  }

  h3 {
    color: $accent;
    margin-bottom: $spacing-sm;
  }
}
</style>
