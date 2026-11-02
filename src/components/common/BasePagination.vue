<template>
  <nav v-if="totalPages > 1" class="pagination" :aria-label="$t('menu.pagination.label')">
    <BaseButton
      variant="secondary"
      size="sm"
      :disabled="page <= 1"
      @click="$emit('change', page - 1)"
    >
      {{ $t('menu.pagination.previous') }}
    </BaseButton>

    <p class="pagination__status" aria-live="polite">
      {{ $t('menu.pagination.status', { page, total: totalPages }) }}
    </p>

    <BaseButton
      variant="secondary"
      size="sm"
      :disabled="page >= totalPages"
      @click="$emit('change', page + 1)"
    >
      {{ $t('menu.pagination.next') }}
    </BaseButton>
  </nav>
</template>

<script>
import BaseButton from './BaseButton.vue'

export default {
  name: 'BasePagination',
  components: { BaseButton },
  props: {
    page: { type: Number, required: true },
    totalPages: { type: Number, required: true },
  },
  emits: ['change'],
}
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.pagination__status {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
</style>
