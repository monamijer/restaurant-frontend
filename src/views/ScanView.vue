<template>
  <div class="scan container">
    <section class="scan__card" aria-live="polite">
      <template v-if="state === 'checking'">
        <BaseSpinner />
        <p>{{ $t('scan.checking') }}</p>
      </template>

      <template v-else-if="state === 'ok'">
        <p class="eyebrow">{{ $t('scan.title') }}</p>
        <h1>{{ $t('scan.success', { number }) }}</h1>
        <p class="muted">{{ $t('scan.successText') }}</p>
        <div class="cluster">
          <BaseButton size="lg" :to="{ name: 'menu' }">{{ $t('scan.menu') }}</BaseButton>
          <BaseButton size="lg" variant="secondary" :to="{ name: 'cart' }">{{ $t('scan.cart') }}</BaseButton>
        </div>
      </template>

      <template v-else>
        <h1>{{ $t('scan.invalidTitle') }}</h1>
        <p class="muted">{{ $t('scan.invalidText') }}</p>
        <BaseButton :to="{ name: 'menu' }">{{ $t('scan.menu') }}</BaseButton>
      </template>
    </section>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import { useTableStore } from '@/store/table'
import { extractTableToken } from '@/utils/tableCode'

// Where a table's QR code lands: /scan?t=TOKEN. The diner does not need an account to scan.
export default {
  name: 'ScanView',
  components: { BaseButton, BaseSpinner },
  data() {
    return { state: 'checking' }
  },
  computed: {
    ...mapState(useTableStore, ['number']),
  },
  async created() {
    const token = extractTableToken(this.$route.query.t)
    if (!token) {
      this.state = 'invalid'
      return
    }
    try {
      await this.scan(token)
      this.state = 'ok'
    } catch {
      this.state = 'invalid' // Every defect looks the same: the page never says why a code failed.
    }
  },
  methods: {
    ...mapActions(useTableStore, ['scan']),
  },
}
</script>

<style scoped>
.scan {
  display: flex;
  justify-content: center;
  padding-block: var(--space-8);
}

.scan__card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
  width: 100%;
  max-width: var(--container-narrow);
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
</style>
