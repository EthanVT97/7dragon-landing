<template>
  <div class="not-found">
    <h1>404</h1>
    <p>Page Not Found</p>
    <router-link to="/" class="btn btn-primary">Go Home</router-link>
  </div>
</template>

<script>
export default {
  name: 'NotFound'
}
</script>

<style lang="scss" scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: $spacing-xl;

  h1 {
    font-size: 6rem;
    color: $accent;
    margin-bottom: $spacing-md;
  }

  p {
    font-size: $font-size-xl;
    margin-bottom: $spacing-xl;
  }
}
</style>
