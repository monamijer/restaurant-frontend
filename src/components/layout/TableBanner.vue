<template>
  <div v-if="isSeated" class="table-banner" role="status">
    <div class="table-banner__inner container">
      <p>{{ $t('table.banner', { number }) }}</p>
      <button type="button" class="table-banner__leave" @click="clear">{{ $t('table.leave') }}</button>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useTableStore } from '@/store/table'

export default {
  name: 'TableBanner',
  computed: {
    ...mapState(useTableStore, ['isSeated', 'number']),
  },
  methods: {
    ...mapActions(useTableStore, ['clear']),
  },
}
</script>

<style scoped>
.table-banner {
  font-size: var(--text-sm);
  font-weight: 600;
  background: var(--color-surface-sunken);
  border-bottom: 1px solid var(--color-border);
}

.table-banner__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: 2.5rem;
}

.table-banner__leave {
  min-height: var(--target-size);
  padding: 0 var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-accent-text);
  text-decoration: underline;
  background: transparent;
  border: 0;
  cursor: pointer;
}
</style>
