<template>
  <div class="pricing">
    <h1>Pricing Plans</h1>
    <div class="pricing-grid">
      <div class="plan">
        <h2>Basic</h2>
        <div class="price">$29/mo</div>
        <ul>
          <li>Up to 500 chats/month</li>
          <li>Basic chatbot</li>
          <li>Email support</li>
        </ul>
        <button class="btn btn-primary">Choose Plan</button>
      </div>
      <div class="plan featured">
        <h2>Professional</h2>
        <div class="price">$99/mo</div>
        <ul>
          <li>Unlimited chats</li>
          <li>Advanced AI chatbot</li>
          <li>24/7 support</li>
          <li>Analytics dashboard</li>
        </ul>
        <button class="btn btn-primary">Choose Plan</button>
      </div>
      <div class="plan">
        <h2>Enterprise</h2>
        <div class="price">Custom</div>
        <ul>
          <li>Custom solutions</li>
          <li>Dedicated support</li>
          <li>Custom integrations</li>
          <li>SLA guarantee</li>
        </ul>
        <button class="btn btn-secondary">Contact Us</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Pricing'
}
</script>

<style lang="scss" scoped>
.pricing {
  padding: $spacing-xl;
  text-align: center;

  h1 {
    margin-bottom: $spacing-xl;
  }
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-lg;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: $tablet) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: $mobile) {
    grid-template-columns: 1fr;
  }
}

.plan {
  padding: $spacing-lg;
  background: rgba($primary, 0.1);
  border-radius: $border-radius-lg;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }

  &.featured {
    background: rgba($accent, 0.1);
    transform: scale(1.05);

    &:hover {
      transform: scale(1.05) translateY(-5px);
    }
  }

  h2 {
    color: $accent;
    margin-bottom: $spacing-md;
  }

  .price {
    font-size: $font-size-xl;
    color: $text;
    margin-bottom: $spacing-lg;
  }

  ul {
    list-style: none;
    padding: 0;
    margin-bottom: $spacing-lg;

    li {
      margin-bottom: $spacing-sm;
    }
  }
}
</style>
