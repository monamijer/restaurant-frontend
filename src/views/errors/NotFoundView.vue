<template>
  <div class="container notice">
    <EmptyState :title="$t('notFound.title')" :description="$t('notFound.text')">
      <BaseButton :to="{ name: 'home' }">{{ $t('notFound.back') }}</BaseButton>
    </EmptyState>
  </div>
</template>

<script>
import BaseButton from '@/components/common/BaseButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'

export default {
  name: 'NotFoundView',
  components: { BaseButton, EmptyState },
}
</script>

<style scoped>
.notice {
  padding-block: var(--space-8);
}
</style>
