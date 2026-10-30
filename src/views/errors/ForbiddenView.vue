<template>
  <div class="container notice">
    <EmptyState :title="$t('forbidden.title')" :description="$t('forbidden.text')">
      <BaseButton :to="{ name: 'home' }">{{ $t('forbidden.back') }}</BaseButton>
    </EmptyState>
  </div>
</template>

<script>
import BaseButton from '@/components/common/BaseButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'

export default {
  name: 'ForbiddenView',
  components: { BaseButton, EmptyState },
}
</script>

<style scoped>
.notice {
  padding-block: var(--space-8);
}
</style>
