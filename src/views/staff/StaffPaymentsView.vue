<template>
  <div class="staff-payments container">
    <StaffNav />

    <header class="head">
      <div>
        <h1>{{ $t('staff.payments.title') }}</h1>
        <p class="muted">{{ $t('staff.payments.subtitle') }}</p>
      </div>
      <p class="muted" role="status" aria-live="polite">
        {{ $t('staff.payments.countLabel', { count }) }}
      </p>
    </header>

    <form class="filters cluster" @submit.prevent="applyFilters">
      <label class="field">
        <span>{{ $t('staff.payments.filters.search') }}</span>
        <input v-model.trim="draft.search" type="search" class="control" maxlength="100" autocomplete="off" />
      </label>

      <label class="field">
        <span>{{ $t('staff.payments.filters.status') }}</span>
        <select v-model="draft.status" class="control">
          <option value="">{{ $t('staff.payments.filters.all') }}</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ $t(`payment.status.${s}`) }}</option>
        </select>
      </label>

      <label class="field">
        <span>{{ $t('staff.payments.filters.method') }}</span>
        <select v-model="draft.method" class="control">
          <option value="">{{ $t('staff.payments.filters.all') }}</option>
          <option v-for="m in methods" :key="m" :value="m">{{ $t(`payment.methods.${m}`) }}</option>
        </select>
      </label>

      <BaseButton type="submit">{{ $t('staff.payments.filters.apply') }}</BaseButton>
      <BaseButton type="button" variant="ghost" @click="clearFilters">
        {{ $t('staff.payments.filters.clear') }}
      </BaseButton>
    </form>

    <FormAlert v-if="actionError" :message="actionError" />

    <EmptyState v-if="failed" :title="$t('staff.payments.failed')">
      <BaseButton variant="secondary" @click="fetchList">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <ul v-else-if="loading && items.length === 0" class="list" aria-hidden="true">
      <li v-for="n in 4" :key="n"><BaseSkeleton height="3rem" /></li>
    </ul>

    <EmptyState v-else-if="items.length === 0" :title="$t('staff.payments.empty')" />

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>{{ $t('staff.payments.columns.reference') }}</th>
            <th>{{ $t('staff.payments.columns.order') }}</th>
            <th>{{ $t('staff.payments.columns.method') }}</th>
            <th class="num">{{ $t('staff.payments.columns.amount') }}</th>
            <th>{{ $t('staff.payments.columns.status') }}</th>
            <th>{{ $t('staff.payments.columns.date') }}</th>
            <th><span class="sr-only">{{ $t('staff.payments.columns.actions') }}</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in items" :key="p.id">
            <td>{{ p.reference || '—' }}</td>
            <td>#{{ p.order }}</td>
            <td>{{ $t(`payment.methods.${p.method}`) }}</td>
            <td class="num">{{ money(p) }}</td>
            <td><BaseBadge :tone="tone(p.status)">{{ $t(`payment.status.${p.status}`) }}</BaseBadge></td>
            <td>{{ date(p.paid_at || p.created_at) }}</td>
            <td>
              <BaseButton
                v-if="canConfirm(p)"
                size="sm"
                :loading="busyId === p.id"
                :disabled="busyId === p.id"
                @click="confirm(p)"
              >
                {{ $t('staff.payments.confirm') }}
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
import FormAlert from '@/components/common/FormAlert.vue'
import StaffNav from '@/components/staff/StaffNav.vue'
import staffPaymentService from '@/services/staffPaymentService'
import { useToastStore } from '@/store/toasts'
import { useUiStore } from '@/store/ui'
import { describeError } from '@/utils/errors'
import { formatDateTime, formatMoney } from '@/utils/format'
import { orderStatusTone } from '@/utils/orders'

const PAGE_SIZE = 20
const POLL_MS = 15000
const STATUSES = ['pending', 'paid', 'failed', 'refunded']
const METHODS = ['cash', 'card', 'mobile_money']
const TONE_AS_ORDER = { pending: 'pending', paid: 'completed', failed: 'cancelled', refunded: 'cancelled' }

export default {
  name: 'StaffPaymentsView',
  components: { BaseBadge, BaseButton, BasePagination, BaseSkeleton, EmptyState, FormAlert, StaffNav },
  data() {
    return {
      items: [],
      count: 0,
      loading: false,
      failed: false,
      busyId: null,
      actionError: '',
      requestId: 0,
      timer: null,
      statuses: STATUSES,
      methods: METHODS,
      draft: {
        search: this.$route.query.search || '',
        status: this.$route.query.status || '',
        method: this.$route.query.method || '',
      },
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
      if (this.$route.query.status) q.status = this.$route.query.status
      if (this.$route.query.method) q.method = this.$route.query.method
      return q
    },
  },
  watch: {
    '$route.fullPath'() {
      if (this.$route.name === 'staff-payments') {
        this.syncDraft()
        this.fetchList()
      }
    },
  },
  created() {
    this.fetchList()
  },
  mounted() {
    this.timer = setInterval(this.tick, POLL_MS)
  },
  beforeUnmount() {
    if (this.timer) clearInterval(this.timer)
  },
  methods: {
    tone(status) { return orderStatusTone(TONE_AS_ORDER[status] || 'pending') },
    money(payment) { return formatMoney(payment.amount, payment.currency, this.locale) },
    date(value) { return formatDateTime(value, this.locale) },
    canConfirm(payment) { return payment.method === 'cash' && payment.status === 'pending' },

    syncDraft() {
      this.draft.search = this.$route.query.search || ''
      this.draft.status = this.$route.query.status || ''
      this.draft.method = this.$route.query.method || ''
    },

    async fetchList() {
      const id = ++this.requestId
      this.loading = true
      this.failed = false
      try {
        const page = await staffPaymentService.list(this.query)
        if (id !== this.requestId) return
        this.items = page.results
        this.count = page.count
      } catch {
        if (id === this.requestId) this.failed = true
      } finally {
        if (id === this.requestId) this.loading = false
      }
    },

    tick() {
      if (document.hidden || this.loading || this.busyId) return
      this.fetchList()
    },

    applyFilters() {
      const query = {}
      if (this.draft.search) query.search = this.draft.search
      if (this.draft.status) query.status = this.draft.status
      if (this.draft.method) query.method = this.draft.method
      this.$router.push({ name: 'staff-payments', query })
    },

    clearFilters() {
      this.draft.search = ''
      this.draft.status = ''
      this.draft.method = ''
      this.$router.push({ name: 'staff-payments', query: {} })
    },

    goToPage(p) {
      const query = { ...this.$route.query }
      if (p > 1) query.page = String(p)
      else delete query.page
      this.$router.push({ name: 'staff-payments', query })
    },

    async confirm(payment) {
      if (this.busyId) return
      this.busyId = payment.id
      this.actionError = ''
      try {
        await staffPaymentService.confirm(payment.id)
        useToastStore().success(this.$t('staff.payments.confirmed'))
        await this.fetchList()
      } catch (error) {
        this.actionError = describeError(error, this.$t.bind(this))
      } finally {
        this.busyId = null
      }
    },
  },
}
</script>

<style scoped>
.staff-payments {
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
