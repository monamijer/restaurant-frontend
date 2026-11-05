<template>
  <div class="staff-home container">
    <StaffNav />

    <header>
      <h1>{{ $t('staff.home.title') }}</h1>
      <p class="muted">{{ $t('staff.home.subtitle') }}</p>
    </header>

    <EmptyState v-if="failed" :title="$t('staff.home.failed')">
      <BaseButton variant="secondary" @click="load">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <p v-else-if="loading && !stats" class="muted" role="status">
      {{ $t('staff.home.loading') }}
    </p>

    <div v-else class="cards">
      <article class="card">
        <h2 class="card__title">{{ $t('staff.home.cards.tables') }}</h2>
        <p class="card__value">{{ value(tablesValue) }}</p>
        <p class="muted">{{ $t('staff.home.cards.tablesHint', { total: value(tablesTotal) }) }}</p>
      </article>

      <article class="card">
        <h2 class="card__title">{{ $t('staff.home.cards.queue') }}</h2>
        <p class="card__value">{{ value(queueWaiting) }}</p>
        <p class="muted">{{ $t('staff.home.cards.queueHint', { minutes: value(queueMinutes) }) }}</p>
      </article>

      <article class="card">
        <h2 class="card__title">{{ $t('staff.home.cards.orders') }}</h2>
        <p class="card__value">{{ value(ordersToday) }}</p>
        <p class="muted">{{ $t('staff.home.cards.ordersHint', { open: value(ordersOpen) }) }}</p>
      </article>

      <article class="card">
        <h2 class="card__title">{{ $t('staff.home.cards.payments') }}</h2>
        <p class="card__value">{{ money(paymentsToday) }}</p>
        <p class="muted">{{ $t('staff.home.cards.paymentsHint', { pending: value(paymentsPending) }) }}</p>
      </article>
    </div>

    <section class="shortcuts">
      <h2>{{ $t('staff.home.shortcutsTitle') }}</h2>
      <div class="cluster">
        <BaseButton :to="{ name: 'staff-orders' }">{{ $t('staff.home.shortcuts.orders') }}</BaseButton>
        <BaseButton variant="secondary" :to="{ name: 'staff-order-new' }">
          {{ $t('staff.home.shortcuts.newOrder') }}
        </BaseButton>
      </div>
    </section>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import BaseButton from '@/components/common/BaseButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StaffNav from '@/components/staff/StaffNav.vue'
import { CURRENCY } from '@/config'
import dashboardService from '@/services/dashboardService'
import { useUiStore } from '@/store/ui'
import { formatMoney } from '@/utils/format'

const DASH = '—'

export default {
  name: 'StaffHomeView',
  components: { BaseButton, EmptyState, StaffNav },
  data() {
    return { stats: null, loading: false, failed: false }
  },
  computed: {
    ...mapState(useUiStore, ['locale']),
    tablesValue() { return this.stats?.today?.tables?.occupied ?? null },
    tablesTotal() { return this.stats?.today?.tables?.total ?? null },
    queueWaiting() { return this.stats?.today?.queue?.waiting ?? null },
    queueMinutes() { return this.stats?.today?.queue?.estimated_wait_minutes ?? null },
    ordersToday() { return this.stats?.today?.orders?.total ?? null },
    ordersOpen() { return this.stats?.today?.orders?.open ?? null },
    paymentsToday() { return this.stats?.today?.payments?.total ?? null },
    paymentsPending() { return this.stats?.today?.payments?.pending ?? null },
  },
  created() {
    this.load()
  },
  methods: {
    value(v) { return v === null || v === undefined ? DASH : v },
    money(amount) {
      if (amount === null || amount === undefined) return DASH
      return formatMoney(String(amount), CURRENCY, this.locale)
    },
    async load() {
      this.loading = true
      this.failed = false
      try {
        this.stats = await dashboardService.stats()
      } catch {
        this.failed = true
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.staff-home {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-6);
}

.cards {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
}

.card {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.card__title {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-weight: 500;
}

.card__value {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 600;
  margin-block: var(--space-2);
}

.shortcuts h2 {
  font-size: var(--text-lg);
  margin-bottom: var(--space-3);
}
</style>
