<template>
  <div class="orders container">
    <header>
      <h1>{{ $t('orders.heading') }}</h1>
    </header>

    <EmptyState v-if="failed" :title="$t('orders.errorTitle')" :description="$t('menu.errorText')">
      <BaseButton variant="secondary" @click="fetchOrders">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <ul v-else-if="loading && orders.length === 0" class="list" aria-hidden="true">
      <li v-for="n in 3" :key="n" class="row row--skeleton"><BaseSkeleton height="3rem" /></li>
    </ul>

    <EmptyState v-else-if="orders.length === 0" :title="$t('orders.emptyTitle')" :description="$t('orders.emptyText')">
      <BaseButton :to="{ name: 'menu' }">{{ $t('orders.emptyAction') }}</BaseButton>
    </EmptyState>

    <ul v-else class="list">
      <li v-for="order in orders" :key="order.id">
        <router-link class="row" :to="{ name: 'order', params: { id: order.id } }">
          <div>
            <p class="row__title">{{ $t('orders.number', { id: order.id }) }}</p>
            <p class="muted row__meta">
              {{ formatDate(order.created_at) }} · {{ $t(`orders.types.${order.order_type}`) }} ·
              {{ $t('orders.items', { count: itemCount(order) }, itemCount(order)) }}
            </p>
          </div>
          <div class="row__end">
            <BaseBadge :tone="tone(order.status)">{{ $t(`orders.status.${order.status}`) }}</BaseBadge>
            <span class="row__total">{{ money(order.total) }}</span>
          </div>
        </router-link>
      </li>
    </ul>

    <BasePagination :page="page" :total-pages="pages" @change="goToPage" />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { CURRENCY } from '@/config'
import { orderService } from '@/services/orderService'
import { useUiStore } from '@/store/ui'
import { formatDateTime, formatMoney } from '@/utils/format'
import { orderStatusTone } from '@/utils/orders'

const PAGE_SIZE = 10

export default {
  name: 'OrdersView',
  components: { BaseBadge, BaseButton, BasePagination, BaseSkeleton, EmptyState },
  data() {
    return { orders: [], count: 0, loading: false, failed: false, requestId: 0 }
  },
  computed: {
    ...mapState(useUiStore, ['locale']),
    page() {
      const page = Number.parseInt(this.$route.query.page, 10)
      return Number.isInteger(page) && page >= 1 ? page : 1
    },
    pages() {
      return Math.max(1, Math.ceil(this.count / PAGE_SIZE))
    },
  },
  watch: {
    '$route.fullPath'() {
      if (this.$route.name === 'orders') this.fetchOrders()
    },
  },
  created() {
    this.fetchOrders()
  },
  methods: {
    tone: orderStatusTone,

    money(amount) {
      return formatMoney(amount, CURRENCY, this.locale)
    },

    formatDate(value) {
      return formatDateTime(value, this.locale)
    },

    itemCount(order) {
      return order.items.reduce((total, item) => total + item.quantity, 0)
    },

    async fetchOrders() {
      const id = ++this.requestId
      this.loading = true
      this.failed = false
      try {
        const page = await orderService.list({ page: this.page, page_size: PAGE_SIZE })
        if (id !== this.requestId) return
        this.orders = page.results
        this.count = page.count
      } catch {
        if (id === this.requestId) this.failed = true
      } finally {
        if (id === this.requestId) this.loading = false
      }
    },

    goToPage(page) {
      this.$router.push({ name: 'orders', query: page > 1 ? { page: String(page) } : {} })
    },
  },
}
</script>

<style scoped>
.orders {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-7) var(--space-6);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0;
  list-style: none;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  color: inherit;
  text-decoration: none;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.row--skeleton {
  display: block;
}

@media (hover: hover) {
  a.row:hover {
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-md);
  }
}

.row__title {
  font-weight: 700;
}

.row__meta {
  font-size: var(--text-sm);
}

.row__end {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.row__total {
  font-family: var(--font-display);
  font-weight: 600;
}
</style>
