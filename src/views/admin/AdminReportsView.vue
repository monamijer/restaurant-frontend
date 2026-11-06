<template>
  <div class="admin-reports container">
    <AdminNav />

    <header>
      <h1>{{ $t('admin.reports.title') }}</h1>
      <p class="muted">{{ $t('admin.reports.subtitle') }}</p>
    </header>

    <form class="filters cluster" @submit.prevent="applyFilters">
      <label class="field">
        <span>{{ $t('admin.reports.filters.report') }}</span>
        <select v-model="draft.report" class="control">
          <option v-for="r in reports" :key="r.key" :value="r.key">{{ $t(`admin.reports.names.${r.key}`) }}</option>
        </select>
      </label>

      <label class="field">
        <span>{{ $t('admin.reports.filters.start') }}</span>
        <input v-model="draft.start" type="date" class="control" />
      </label>
      <label class="field">
        <span>{{ $t('admin.reports.filters.end') }}</span>
        <input v-model="draft.end" type="date" class="control" />
      </label>

      <label v-if="supportsGroupBy" class="field">
        <span>{{ $t('admin.reports.filters.groupBy') }}</span>
        <select v-model="draft.groupBy" class="control">
          <option value="day">{{ $t('admin.reports.groupBy.day') }}</option>
          <option value="week">{{ $t('admin.reports.groupBy.week') }}</option>
          <option value="month">{{ $t('admin.reports.groupBy.month') }}</option>
        </select>
      </label>

      <label v-if="supportsLimit" class="field">
        <span>{{ $t('admin.reports.filters.limit') }}</span>
        <input v-model.number="draft.limit" type="number" min="1" max="50" class="control" />
      </label>

      <BaseButton type="submit">{{ $t('admin.reports.filters.apply') }}</BaseButton>
      <BaseButton type="button" variant="ghost" @click="clearFilters">
        {{ $t('admin.reports.filters.clear') }}
      </BaseButton>
    </form>

    <div class="cluster">
      <BaseButton variant="secondary" :loading="downloading" :disabled="downloading" @click="downloadCsv">
        {{ $t('admin.reports.downloadCsv') }}
      </BaseButton>
      <p v-if="csvOnly" class="muted">{{ $t('admin.reports.csvOnly') }}</p>
    </div>

    <EmptyState v-if="failed" :title="$t('admin.reports.failed')">
      <BaseButton variant="secondary" @click="fetchReport">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <p v-else-if="loading" class="muted" role="status">{{ $t('admin.reports.loading') }}</p>

    <template v-else-if="!csvOnly">
      <EmptyState v-if="rows.length === 0" :title="$t('admin.reports.empty')" />
      <BaseChart v-else-if="chart" :type="chart.type" :data="chart.data"
        :label="$t('admin.reports.chartLabel', { name: $t(`admin.reports.names.${currentReport.key}`) })" />
      <div v-if="rows.length > 0" class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th v-for="column in currentReport.columns" :key="column">{{ $t(`admin.reports.columns.${column}`) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in rows" :key="index">
              <td v-for="column in currentReport.columns" :key="column" :class="{ num: isNumeric(column) }">
                {{ displayCell(row, column) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import AdminNav from '@/components/admin/AdminNav.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseChart from '@/components/common/BaseChart.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { CURRENCY } from '@/config'
import { adminReportService } from '@/services/adminReportService'
import { useUiStore } from '@/store/ui'
import { describeError } from '@/utils/errors'
import { saveBlob } from '@/utils/download'
import { formatDateTime, formatMoney } from '@/utils/format'

const REPORTS = {
  revenue: {
    key: 'revenue',
    path: '/reports/revenue/',
    loader: 'revenue',
    columns: ['period', 'revenue', 'orders', 'average_order_value'],
    supportsGroupBy: true,
    supportsLimit: false,
    csvOnly: false,
  },
  'order-volume': {
    key: 'order-volume',
    path: '/reports/order-volume/',
    loader: 'orderVolume',
    columns: ['period', 'total', 'dine_in', 'takeaway', 'delivery', 'cancelled'],
    supportsGroupBy: true,
    supportsLimit: false,
    csvOnly: false,
  },
  'top-items': {
    key: 'top-items',
    path: '/reports/top-items/',
    loader: 'topItems',
    columns: ['menu_item', 'name', 'quantity', 'revenue'],
    supportsGroupBy: false,
    supportsLimit: true,
    csvOnly: false,
  },
  'peak-hours': {
    key: 'peak-hours',
    path: '/reports/peak-hours/',
    loader: 'peakHours',
    columns: ['hour', 'orders', 'revenue'],
    supportsGroupBy: false,
    supportsLimit: false,
    csvOnly: false,
  },
  'table-utilization': {
    key: 'table-utilization',
    path: '/reports/table-utilization/',
    loader: 'tableUtilization',
    columns: ['number', 'capacity', 'reservations', 'reserved_minutes', 'utilisation_percent', 'dine_in_orders', 'orders_value'],
    supportsGroupBy: false,
    supportsLimit: false,
    csvOnly: false,
  },
  payments: {
    key: 'payments',
    path: '/reports/payments/',
    loader: null,
    columns: ['reference', 'order', 'method', 'status', 'amount', 'created_at', 'paid_at'],
    supportsGroupBy: false,
    supportsLimit: false,
    csvOnly: true,
  },
}

const MONEY_COLUMNS = ['revenue', 'average_order_value', 'amount', 'orders_value']
const NUMERIC_COLUMNS = ['orders', 'total', 'dine_in', 'takeaway', 'delivery', 'cancelled', 'quantity', 'hour', 'capacity', 'reservations', 'reserved_minutes', 'utilisation_percent', 'dine_in_orders', 'order']
const DATE_COLUMNS = ['created_at', 'paid_at']

export default {
  name: 'AdminReportsView',
  components: { AdminNav, BaseButton, BaseChart, EmptyState },
  data() {
    return {
      rows: [],
      loading: false,
      failed: false,
      downloading: false,
      actionError: '',
      reports: Object.values(REPORTS),
      draft: {
        report: this.$route.query.report && REPORTS[this.$route.query.report] ? this.$route.query.report : 'revenue',
        start: this.$route.query.start || '',
        end: this.$route.query.end || '',
        groupBy: this.$route.query.group_by || 'day',
        limit: this.$route.query.limit ? Number(this.$route.query.limit) : 10,
      },
    }
  },
  computed: {
    ...mapState(useUiStore, ['locale']),
    currentReport() {
      return REPORTS[this.draft.report]
    },
    csvOnly() {
      return this.currentReport.csvOnly
    },
    chart() {
      const rows = this.rows
      const set = (key, field) => ({ label: this.$t(`admin.reports.series.${key}`), data: rows.map((r) => Number(r[field])) })
      switch (this.draft.report) {
        case 'revenue': return { type: 'line', data: { labels: rows.map((r) => r.period), datasets: [set('revenue', 'revenue')] } }
        case 'order-volume': return { type: 'bar', data: { labels: rows.map((r) => r.period), datasets: [set('orders', 'total')] } }
        case 'top-items': return { type: 'bar', data: { labels: rows.map((r) => r.name), datasets: [set('quantity', 'quantity')] } }
        case 'peak-hours': return { type: 'bar', data: { labels: rows.map((r) => `${r.hour}h`), datasets: [set('orders', 'orders')] } }
        case 'table-utilization': return { type: 'bar', data: { labels: rows.map((r) => String(r.number)), datasets: [set('utilisation', 'utilisation_percent')] } }
        default: return null
      }
    },
    supportsGroupBy() {
      return this.currentReport.supportsGroupBy
    },
    supportsLimit() {
      return this.currentReport.supportsLimit
    },
  },
  watch: {
    'draft.report'() {
      this.rows = []
      this.fetchReport()
    },
    '$route.fullPath'() {
      if (this.$route.name === 'admin-reports') {
        this.syncDraft()
        this.fetchReport()
      }
    },
  },
  created() {
    this.fetchReport()
  },
  methods: {
    money(amount) { return formatMoney(amount, CURRENCY, this.locale) },
    date(value) { return formatDateTime(value, this.locale) },
    isNumeric(column) {
      return MONEY_COLUMNS.includes(column) || NUMERIC_COLUMNS.includes(column)
    },
    displayCell(row, column) {
      const value = row[column]
      if (value === null || value === undefined || value === '') return '—'
      if (MONEY_COLUMNS.includes(column)) return this.money(value)
      if (DATE_COLUMNS.includes(column)) return this.date(value)
      if (column === 'utilisation_percent') return `${value} %`
      return String(value)
    },

    syncDraft() {
      this.draft.report = this.$route.query.report && REPORTS[this.$route.query.report]
        ? this.$route.query.report : 'revenue'
      this.draft.start = this.$route.query.start || ''
      this.draft.end = this.$route.query.end || ''
      this.draft.groupBy = this.$route.query.group_by || 'day'
      this.draft.limit = this.$route.query.limit ? Number(this.$route.query.limit) : 10
    },

    query() {
      const q = {}
      if (this.$route.query.start) q.start = this.$route.query.start
      if (this.$route.query.end) q.end = this.$route.query.end
      if (this.supportsGroupBy) q.group_by = this.$route.query.group_by || 'day'
      if (this.supportsLimit) q.limit = this.$route.query.limit ? Number(this.$route.query.limit) : 10
      return q
    },

    async fetchReport() {
      const report = this.currentReport
      this.loading = true
      this.failed = false
      this.actionError = ''
      try {
        if (report.csvOnly) {
          this.rows = []
          return
        }
        const data = await adminReportService[report.loader](this.query())
        this.rows = data.results
      } catch (error) {
        this.failed = true
        this.actionError = describeError(error, this.$t.bind(this))
      } finally {
        this.loading = false
      }
    },

    applyFilters() {
      const query = { report: this.draft.report }
      if (this.draft.start) query.start = this.draft.start
      if (this.draft.end) query.end = this.draft.end
      if (this.supportsGroupBy) query.group_by = this.draft.groupBy
      if (this.supportsLimit) query.limit = String(this.draft.limit)
      this.$router.push({ name: 'admin-reports', query })
    },

    clearFilters() {
      this.draft.start = ''
      this.draft.end = ''
      this.draft.groupBy = 'day'
      this.draft.limit = 10
      this.$router.push({ name: 'admin-reports', query: { report: this.draft.report } })
    },

    async downloadCsv() {
      if (this.downloading) return
      this.downloading = true
      this.actionError = ''
      try {
        const blob = await adminReportService.csv(this.currentReport.path, this.query())
        const name = this.currentReport.key
        const start = this.$route.query.start || 'from'
        const end = this.$route.query.end || 'to'
        saveBlob(blob, `report-${name}-${start}-${end}.csv`)
      } catch (error) {
        this.actionError = describeError(error, this.$t.bind(this))
      } finally {
        this.downloading = false
      }
    },
  },
}
</script>

<style scoped>
.admin-reports {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-6);
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
}

.table tr:last-child td {
  border-bottom: none;
}

.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
