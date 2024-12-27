<template>
  <div class="modal-overlay" v-if="show" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Modal',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    title: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 300px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  color: #666;
}

.close-button:hover {
  color: #000;
}
</style>
