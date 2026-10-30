<template>
  <div class="area container">
    <h1 class="area__title">{{ $t($route.meta.titleKey) }}</h1>
    <EmptyState :title="$t('area.comingTitle')" :description="$t('area.comingText')" />
  </div>
</template>

<script>
import EmptyState from '@/components/common/EmptyState.vue'

// Stands in for the staff and administration areas until they are built.
export default {
  name: 'AreaPlaceholderView',
  components: { EmptyState },
}
</script>

<style scoped>
.area {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-7);
}
</style>
