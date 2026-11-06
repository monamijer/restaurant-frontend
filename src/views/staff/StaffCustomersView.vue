<template>
  <div class="staff-customers container">
    <StaffNav />

    <header class="head">
      <div>
        <h1>{{ $t('staff.customers.title') }}</h1>
        <p class="muted">{{ $t('staff.customers.subtitle') }}</p>
      </div>
      <p class="muted" role="status" aria-live="polite">
        {{ $t('staff.customers.countLabel', { count }) }}
      </p>
    </header>

    <form class="filters cluster" @submit.prevent="applyFilters">
      <label class="field">
        <span>{{ $t('staff.customers.filters.search') }}</span>
        <input v-model.trim="draft.search" type="search" class="control" maxlength="100" autocomplete="off" />
      </label>

      <BaseButton type="submit">{{ $t('staff.customers.filters.apply') }}</BaseButton>
      <BaseButton type="button" variant="ghost" @click="clearFilters">
        {{ $t('staff.customers.filters.clear') }}
      </BaseButton>
    </form>

    <EmptyState v-if="failed" :title="$t('staff.customers.failed')">
      <BaseButton variant="secondary" @click="fetchList">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <ul v-else-if="loading && items.length === 0" class="list" aria-hidden="true">
      <li v-for="n in 4" :key="n"><BaseSkeleton height="3rem" /></li>
    </ul>

    <EmptyState v-else-if="items.length === 0" :title="$t('staff.customers.empty')" />

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>{{ $t('staff.customers.columns.name') }}</th>
            <th>{{ $t('staff.customers.columns.email') }}</th>
            <th>{{ $t('staff.customers.columns.phone') }}</th>
            <th class="num">{{ $t('staff.customers.columns.orders') }}</th>
            <th class="num">{{ $t('staff.customers.columns.spent') }}</th>
            <th>{{ $t('staff.customers.columns.lastOrder') }}</th>
            <th>{{ $t('staff.customers.columns.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in items" :key="c.id">
            <td>{{ fullName(c) }}</td>
            <td>{{ c.email }}</td>
            <td>{{ c.phone || '—' }}</td>
            <td class="num">{{ c.orders_count }}</td>
            <td class="num">{{ money(c.total_spent) }}</td>
            <td>{{ c.last_order_at ? date(c.last_order_at) : '—' }}</td>
            <td>
              <BaseBadge :tone="c.is_active ? 'success' : 'neutral'">
                {{ c.is_active ? $t('staff.customers.active') : $t('staff.customers.inactive') }}
              </BaseBadge>
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
import { staffCustomerService } from '@/services/staffCustomerService'
import { useUiStore } from '@/store/ui'
import { formatDateTime, formatMoney } from '@/utils/format'

const PAGE_SIZE = 20

export default {
  name: 'StaffCustomersView',
  components: { BaseBadge, BaseButton, BasePagination, BaseSkeleton, EmptyState, StaffNav },
  data() {
    return {
      items: [],
      count: 0,
      loading: false,
      failed: false,
      requestId: 0,
      draft: { search: this.$route.query.search || '' },
    }
  },
  computed: {
    ...mapState(useUiStore, ['locale']),
    page() {
      const p = Number.parseInt(this.$route.query.page, 10)
      return Number.isInteger(p) && p >= 1 ? p : 1
    },
    pages() {
      return Math.max(1, Math.ceil(this.count / PAGE_SIZE))
    },
    query() {
      const q = { page: this.page, page_size: PAGE_SIZE }
      if (this.$route.query.search) q.search = this.$route.query.search
      return q
    },
  },
  watch: {
    '$route.fullPath'() {
      if (this.$route.name === 'staff-customers') {
        this.draft.search = this.$route.query.search || ''
        this.fetchList()
      }
    },
  },
  created() {
    this.fetchList()
  },
  methods: {
    money(amount) { return formatMoney(amount, CURRENCY, this.locale) },
    date(value) { return formatDateTime(value, this.locale) },
    fullName(customer) {
      return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || '—'
    },

    async fetchList() {
      const id = ++this.requestId
      this.loading = true
      this.failed = false
      try {
        const page = await staffCustomerService.list(this.query)
        if (id !== this.requestId) return
        this.items = page.results
        this.count = page.count
      } catch {
        if (id === this.requestId) this.failed = true
      } finally {
        if (id === this.requestId) this.loading = false
      }
    },

    applyFilters() {
      const query = {}
      if (this.draft.search) query.search = this.draft.search
      this.$router.push({ name: 'staff-customers', query })
    },

    clearFilters() {
      this.draft.search = ''
      this.$router.push({ name: 'staff-customers', query: {} })
    },

    goToPage(p) {
      const query = { ...this.$route.query }
      if (p > 1) query.page = String(p)
      else delete query.page
      this.$router.push({ name: 'staff-customers', query })
    },
  },
}
</script>

<style scoped>
.staff-customers {
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

.control {
  min-height: var(--target-size);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: inherit;
  font: inherit;
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0;
  list-style: none;
}

.table-wrap {
  overflow-x: auto;
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
  vertical-align: middle;
  border-bottom: 1px solid var(--color-border);
}

.table .num {
  text-align: right;
}
</style>
