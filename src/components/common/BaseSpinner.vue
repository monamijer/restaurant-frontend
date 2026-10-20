<template>
  <span class="spinner" :class="{ 'spinner--small': small }" :role="decorative ? null : 'status'">
    <span class="spinner__ring" aria-hidden="true" />
    <span v-if="!decorative" class="visually-hidden">{{ label || $t('common.loading') }}</span>
  </span>
</template>

<script>
export default {
  name: 'BaseSpinner',
  props: {
    small: { type: Boolean, default: false },
    // A decorative spinner (inside a button that already says it is busy) is hidden from screen readers.
    decorative: { type: Boolean, default: false },
    label: { type: String, default: '' },
  },
}
</script>

<style scoped>
.spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinner__ring {
  width: 1.75rem;
  height: 1.75rem;
  border: 3px solid var(--color-border-strong);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner--small .spinner__ring {
  width: 1rem;
  height: 1rem;
  border-width: 2px;
  border-color: currentColor;
  border-top-color: transparent;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
