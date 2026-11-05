<template>
  <div class="staff-orders container">
    <StaffNav />

    <header class="head">
      <div>
        <h1>{{ $t('staff.orders.title') }}</h1>
        <p class="muted">{{ $t('staff.orders.subtitle') }}</p>
      </div>
      <p class="muted" role="status" aria-live="polite">
        {{ $t('staff.orders.countLabel', { count }) }}
      </p>
    </header>

    <form class="filters cluster" @submit.prevent="applyFilters">
      <label class="field">
        <span>{{ $t('staff.orders.filters.status') }}</span>
        <select v-model="draft.status" class="control">
          <option value="">{{ $t('staff.orders.filters.all') }}</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ $t(`orders.status.${s}`) }}</option>
        </select>
      </label>

      <label class="field">
        <span>{{ $t('staff.orders.filters.type') }}</span>
        <select v-model="draft.order_type" class="control">
          <option value="">{{ $t('staff.orders.filters.all') }}</option>
          <option v-for="t in types" :key="t" :value="t">{{ $t(`orders.types.${t}`) }}</option>
        </select>
      </label>

      <label class="field field--check">
        <input v-model="draft.active" type="checkbox" />
        <span>{{ $t('staff.orders.filters.active') }}</span>
      </label>

      <BaseButton type="submit">{{ $t('staff.orders.filters.status') }}</BaseButton>
      <BaseButton type="button" variant="ghost" @click="clearFilters">
        {{ $t('staff.orders.filters.clear') }}
      </BaseButton>
    </form>

    <EmptyState v-if="failed" :title="$t('staff.orders.failed')">
      <BaseButton variant="secondary" @click="fetchOrders">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <ul v-else-if="loading && orders.length === 0" class="list" aria-hidden="true">
      <li v-for="n in 4" :key="n"><BaseSkeleton height="3rem" /></li>
    </ul>

    <EmptyState v-else-if="orders.length === 0" :title="$t('staff.orders.empty')" />

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>{{ $t('staff.orders.columns.id') }}</th>
            <th>{{ $t('staff.orders.columns.createdAt') }}</th>
            <th>{{ $t('staff.orders.columns.customer') }}</th>
            <th>{{ $t('staff.orders.columns.type') }}</th>
            <th>{{ $t('staff.orders.columns.status') }}</th>
            <th class="num">{{ $t('staff.orders.columns.total') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>#{{ order.id }}</td>
            <td>{{ date(order.created_at) }}</td>
            <td>{{ order.customer_name || '—' }}</td>
            <td>{{ $t(`orders.types.${order.order_type}`) }}</td>
            <td>
              <BaseBadge :tone="tone(order.status)">{{ $t(`orders.status.${order.status}`) }}</BaseBadge>
            </td>
            <td class="num">{{ money(order.total) }}</td>
            <td>
              <BaseButton
                size="sm"
                variant="secondary"
                :to="{ name: 'staff-order', params: { id: order.id } }"
              >
                {{ $t('staff.orders.open') }}
              </BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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
import StaffNav from '@/components/staff/StaffNav.vue'
import { CURRENCY } from '@/config'
import staffOrderService from '@/services/staffOrderService'
import { useUiStore } from '@/store/ui'
import { formatDateTime, formatMoney } from '@/utils/format'
import { orderStatusTone } from '@/utils/orders'

const PAGE_SIZE = 20
const POLL_MS = 15000
const STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']
const TYPES = ['dine_in', 'takeaway', 'delivery']

export default {
  name: 'StaffOrdersView',
  components: { BaseBadge, BaseButton, BasePagination, BaseSkeleton, EmptyState, StaffNav },
  data() {
    return {
      orders: [],
      count: 0,
      loading: false,
      failed: false,
      requestId: 0,
      timer: null,
      draft: {
        status: this.$route.query.status || '',
        order_type: this.$route.query.order_type || '',
        active: this.$route.query.active === '1',
      },
      statuses: STATUSES,
      types: TYPES,
    }
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
    query() {
      const q = { page: this.page, page_size: PAGE_SIZE }
      if (this.$route.query.status) q.status = this.$route.query.status
      if (this.$route.query.order_type) q.order_type = this.$route.query.order_type
      if (this.$route.query.active === '1') q.active = true
      return q
    },
  },
  watch: {
    '$route.fullPath'() {
      if (this.$route.name === 'staff-orders') {
        this.syncDraftFromRoute()
        this.fetchOrders()
      }
    },
  },
  created() {
    this.fetchOrders()
  },
  mounted() {
    this.timer = setInterval(this.tick, POLL_MS)
  },
  beforeUnmount() {
    if (this.timer) clearInterval(this.timer)
  },
  methods: {
    tone: orderStatusTone,
    money(amount) { return formatMoney(amount, CURRENCY, this.locale) },
    date(value) { return formatDateTime(value, this.locale) },

    syncDraftFromRoute() {
      this.draft.status = this.$route.query.status || ''
      this.draft.order_type = this.$route.query.order_type || ''
      this.draft.active = this.$route.query.active === '1'
    },

    async fetchOrders() {
      const id = ++this.requestId
      this.loading = true
      this.failed = false
      try {
        const page = await staffOrderService.list(this.query)
        if (id !== this.requestId) return
        this.orders = page.results
        this.count = page.count
      } catch {
        if (id === this.requestId) this.failed = true
      } finally {
        if (id === this.requestId) this.loading = false
      }
    },

    tick() {
      if (document.hidden) return
      if (this.loading) return
      this.fetchOrders()
    },

    applyFilters() {
      const q = {}
      if (this.draft.status) q.status = this.draft.status
      if (this.draft.order_type) q.order_type = this.draft.order_type
      if (this.draft.active) q.active = '1'
      this.$router.push({ name: 'staff-orders', query: q })
    },

    clearFilters() {
      this.draft.status = ''
      this.draft.order_type = ''
      this.draft.active = false
      this.$router.push({ name: 'staff-orders', query: {} })
    },

    goToPage(page) {
      const query = { ...this.$route.query }
      if (page > 1) query.page = String(page)
      else delete query.page
      this.$router.push({ name: 'staff-orders', query })
    },
  },
}
</script>

<style scoped>
.staff-orders {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-6);
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-3);
}

.filters {
  align-items: end;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-sm);
}

.field--check {
  flex-direction: row;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--target-size);
}

.control {
  min-height: var(--target-size);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: inherit;
  font: inherit;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.table th,
.table td {
  padding: var(--space-3);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.table tr:last-child td {
  border-bottom: none;
}

.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
