<template>
  <div class="empty">
    <h3 class="empty__title">{{ title }}</h3>
    <p v-if="description" class="empty__text muted">{{ description }}</p>
    <div v-if="$slots.default" class="empty__actions">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    title: { type: String, required: true },
    description: { type: String, default: '' },
  },
}
</script>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-7) var(--space-5);
  text-align: center;
  background: var(--color-surface);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
}

.empty__title {
  font-size: var(--text-xl);
}

.empty__text {
  max-width: 32rem;
}

.empty__actions {
  margin-top: var(--space-2);
}
</style>
