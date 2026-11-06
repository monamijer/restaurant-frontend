<template>
  <div class="admin-dashboard container">
    <AdminNav />

    <header class="head">
      <div>
        <h1>{{ $t('admin.dashboard.title') }}</h1>
        <p class="muted">{{ $t('admin.dashboard.subtitle') }}</p>
      </div>
      <p v-if="stats" class="muted">
        {{ periodStart }} – {{ periodEnd }}
        · {{ $t('admin.dashboard.daysCount', { count: stats.period.days }) }}
      </p>
    </header>

    <form class="filters cluster" @submit.prevent="applyFilters">
      <label class="field">
        <span>{{ $t('admin.dashboard.filters.start') }}</span>
        <input v-model="draft.start" type="date" class="control" />
      </label>
      <label class="field">
        <span>{{ $t('admin.dashboard.filters.end') }}</span>
        <input v-model="draft.end" type="date" class="control" />
      </label>
      <label class="field">
        <span>{{ $t('admin.dashboard.filters.groupBy') }}</span>
        <select v-model="draft.groupBy" class="control">
          <option value="day">{{ $t('admin.dashboard.groupBy.day') }}</option>
          <option value="week">{{ $t('admin.dashboard.groupBy.week') }}</option>
          <option value="month">{{ $t('admin.dashboard.groupBy.month') }}</option>
        </select>
      </label>
      <BaseButton type="submit">{{ $t('admin.dashboard.filters.apply') }}</BaseButton>
      <BaseButton type="button" variant="ghost" @click="clearFilters">
        {{ $t('admin.dashboard.filters.clear') }}
      </BaseButton>
    </form>

    <EmptyState v-if="failed" :title="$t('admin.dashboard.failed')">
      <BaseButton variant="secondary" @click="fetch">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <p v-else-if="loading && !stats" class="muted" role="status">{{ $t('admin.dashboard.loading') }}</p>

    <template v-else-if="stats">
      <section aria-labelledby="kpis-title">
        <h2 id="kpis-title" class="section-title">{{ $t('admin.dashboard.kpisTitle') }}</h2>
        <ul class="kpis">
          <li v-for="kpi in kpiCards" :key="kpi.key" class="kpi">
            <p class="kpi__label">{{ $t(`admin.dashboard.kpis.${kpi.key}`) }}</p>
            <p class="kpi__value">{{ kpi.display }}</p>
            <p class="kpi__change" :class="`kpi__change--${kpi.tone}`">
              <span aria-hidden="true">{{ kpi.arrow }}</span>
              {{ kpi.changeLabel }}
            </p>
          </li>
        </ul>
      </section>

      <section aria-labelledby="today-title">
        <h2 id="today-title" class="section-title">{{ $t('admin.dashboard.todayTitle') }}</h2>
        <dl class="today">
          <div><dt>{{ $t('admin.dashboard.today.reservations') }}</dt><dd>{{ stats.today.reservations_today }}</dd></div>
          <div><dt>{{ $t('admin.dashboard.today.pendingReservations') }}</dt><dd>{{ stats.today.pending_reservations }}</dd></div>
          <div><dt>{{ $t('admin.dashboard.today.queue') }}</dt><dd>{{ stats.today.queue_waiting }}</dd></div>
          <div><dt>{{ $t('admin.dashboard.today.ordersInProgress') }}</dt><dd>{{ stats.today.orders_in_progress }}</dd></div>
          <div><dt>{{ $t('admin.dashboard.today.pendingPayments') }}</dt><dd>{{ stats.today.pending_payments }}</dd></div>
          <div>
            <dt>{{ $t('admin.dashboard.today.occupancy') }}</dt>
            <dd>{{ stats.today.tables.occupied }} / {{ stats.today.tables.total }}
              · {{ percent(stats.today.tables.occupancy_percent) }}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="revenue-title">
        <h2 id="revenue-title" class="section-title">{{ $t('admin.dashboard.revenueTitle') }}</h2>
        <EmptyState v-if="stats.revenue_over_time.length === 0" :title="$t('admin.dashboard.emptySeries')" />
        <BaseChart v-else type="line" :data="revenueChart" :label="$t('admin.dashboard.revenueTitle')" />
      </section>

      <section aria-labelledby="orders-title">
        <h2 id="orders-title" class="section-title">{{ $t('admin.dashboard.ordersTitle') }}</h2>
        <EmptyState v-if="stats.orders_over_time.length === 0" :title="$t('admin.dashboard.emptySeries')" />
        <BaseChart v-else type="bar" :data="ordersChart" :label="$t('admin.dashboard.ordersTitle')" />
      </section>

      <div class="charts-pair">
        <section aria-labelledby="mix-title">
          <h2 id="mix-title" class="section-title">{{ $t('admin.dashboard.orderMixTitle') }}</h2>
          <EmptyState v-if="orderMixTotal === 0" :title="$t('admin.dashboard.emptySeries')" />
          <BaseChart v-else type="doughnut" :data="orderMixChart" :label="$t('admin.dashboard.orderMixTitle')" />
        </section>
        <section aria-labelledby="occupancy-title">
          <h2 id="occupancy-title" class="section-title">{{ $t('admin.dashboard.occupancyTitle') }}</h2>
          <EmptyState v-if="stats.today.tables.total === 0" :title="$t('admin.dashboard.emptySeries')" />
          <BaseChart v-else type="doughnut" :data="occupancyChart" :label="$t('admin.dashboard.occupancyTitle')" />
        </section>
      </div>

      <section aria-labelledby="top-title">
        <h2 id="top-title" class="section-title">{{ $t('admin.dashboard.topItemsTitle') }}</h2>
        <EmptyState v-if="stats.top_items.length === 0" :title="$t('admin.dashboard.noTopItems')" />
        <BaseChart v-if="stats.top_items.length > 0" type="bar" :data="topItemsChart" :options="{ indexAxis: 'y' }" :label="$t('admin.dashboard.topItemsChartTitle')" />
        <div v-if="stats.top_items.length > 0" class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>{{ $t('admin.dashboard.columns.name') }}</th>
                <th class="num">{{ $t('admin.dashboard.columns.quantity') }}</th>
                <th class="num">{{ $t('admin.dashboard.columns.revenue') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in stats.top_items" :key="item.menu_item">
                <td>{{ item.name }}</td>
                <td class="num">{{ item.quantity }}</td>
                <td class="num">{{ money(item.revenue) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="activity-title">
        <h2 id="activity-title" class="section-title">{{ $t('admin.dashboard.activityTitle') }}</h2>
        <EmptyState v-if="stats.recent_activity.length === 0" :title="$t('admin.dashboard.noActivity')" />
        <ul v-else class="activity">
          <li v-for="event in stats.recent_activity" :key="`${event.type}-${event.id}`" class="activity__item">
            <span class="activity__type">{{ $t(`admin.dashboard.activity.types.${event.type}`) }}</span>
            <span class="muted">{{ date(event.at) }}</span>
            <span class="activity__status">{{ statusLabel(event) }}</span>
            <span v-if="event.amount" class="num">{{ money(event.amount) }}</span>
          </li>
        </ul>
      </section>
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
import { adminDashboardService } from '@/services/adminDashboardService'
import { useUiStore } from '@/store/ui'
import { formatDateTime, formatDay, formatMoney } from '@/utils/format'

const KPI_KEYS = ['revenue', 'orders', 'average_order_value', 'new_customers']

export default {
  name: 'AdminDashboardView',
  components: { AdminNav, BaseButton, BaseChart, EmptyState },
  data() {
    return {
      stats: null,
      loading: false,
      failed: false,
      draft: {
        start: this.$route.query.start || '',
        end: this.$route.query.end || '',
        groupBy: this.$route.query.group_by || 'day',
      },
    }
  },
  computed: {
    ...mapState(useUiStore, ['locale']),
    kpiCards() {
      if (!this.stats) return []
      return KPI_KEYS.map((key) => {
        const kpi = this.stats.kpis[key]
        return {
          key,
          display: this.displayKpi(key, kpi.value),
          ...this.changeParts(kpi.change_percent),
        }
      })
    },
    revenueChart() {
      return { labels: this.stats.revenue_over_time.map((r) => r.period),
        datasets: [{ label: this.$t('admin.dashboard.series.revenue'), data: this.stats.revenue_over_time.map((r) => Number(r.revenue)) }] }
    },
    periodStart() {
      if (!this.stats) return ''
      return formatDay(this.stats.period.start, this.locale)
    },
    periodEnd() {
      if (!this.stats) return ''
      return formatDay(this.stats.period.end, this.locale)
    },
    ordersChart() {
      return { labels: this.stats.orders_over_time.map((r) => r.period),
        datasets: [{ label: this.$t('admin.dashboard.series.orders'), data: this.stats.orders_over_time.map((r) => r.total) }] }
    },
    orderMixTotals() {
      return ['dine_in', 'takeaway', 'delivery', 'cancelled'].map((k) => this.stats.orders_over_time.reduce((n, r) => n + (r[k] || 0), 0))
    },
    orderMixTotal() { return this.orderMixTotals.reduce((n, v) => n + v, 0) },
    orderMixChart() {
      return { labels: ['dine_in', 'takeaway', 'delivery', 'cancelled'].map((k) => this.$t(`admin.dashboard.orderTypes.${k}`)),
        datasets: [{ label: this.$t('admin.dashboard.series.orders'), data: this.orderMixTotals }] }
    },
    occupancyChart() {
      const keys = ['available', 'occupied', 'reserved', 'cleaning']
      const t = this.stats.today.tables
      return { labels: keys.map((k) => this.$t(`admin.dashboard.tableStates.${k}`)),
        datasets: [{ label: this.$t('admin.dashboard.occupancyTitle'), data: keys.map((k) => t[k] || 0) }] }
    },
    topItemsChart() {
      return { labels: this.stats.top_items.map((i) => i.name),
        datasets: [{ label: this.$t('admin.dashboard.series.quantity'), data: this.stats.top_items.map((i) => i.quantity) }] }
    },
  },
  watch: {
    '$route.fullPath'() {
      if (this.$route.name === 'admin-dashboard') {
        this.syncDraft()
        this.fetch()
      }
    },
  },
  created() {
    this.fetch()
  },
  methods: {
    money(amount) { return formatMoney(amount, CURRENCY, this.locale) },
    date(value) { return formatDateTime(value, this.locale) },
    percent(value) {
      return new Intl.NumberFormat(this.locale, { style: 'percent', maximumFractionDigits: 1 }).format(value / 100)
    },

    displayKpi(key, value) {
      if (key === 'revenue' || key === 'average_order_value') return this.money(value)
      if (key === 'new_customers') return String(value)
      return String(value)
    },

    changeParts(changePercent) {
      if (changePercent === null || changePercent === undefined) {
        return { arrow: '—', tone: 'neutral', changeLabel: this.$t('admin.dashboard.noChange') }
      }
      const sign = changePercent > 0 ? '+' : changePercent < 0 ? '−' : ''
      const arrow = changePercent > 0 ? '▲' : changePercent < 0 ? '▼' : '='
      const tone = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'neutral'
      const magnitude = Math.abs(changePercent)
      return { arrow, tone, changeLabel: `${sign}${magnitude.toFixed(1)} %` }
    },

    statusLabel(event) {
      if (event.type === 'order') return this.$t(`orders.status.${event.status}`)
      if (event.type === 'reservation') return this.$t(`reservations.status.${event.status}`)
      if (event.type === 'payment') return this.$t(`payment.status.${event.status}`)
      return event.status
    },

    syncDraft() {
      this.draft.start = this.$route.query.start || ''
      this.draft.end = this.$route.query.end || ''
      this.draft.groupBy = this.$route.query.group_by || 'day'
    },

    async fetch() {
      this.loading = true
      this.failed = false
      try {
        this.stats = await adminDashboardService.stats(this.query())
      } catch {
        this.failed = true
      } finally {
        this.loading = false
      }
    },

    query() {
      const q = { group_by: this.$route.query.group_by || 'day' }
      if (this.$route.query.start) q.start = this.$route.query.start
      if (this.$route.query.end) q.end = this.$route.query.end
      return q
    },

    applyFilters() {
      const query = { group_by: this.draft.groupBy }
      if (this.draft.start) query.start = this.draft.start
      if (this.draft.end) query.end = this.draft.end
      this.$router.push({ name: 'admin-dashboard', query })
    },

    clearFilters() {
      this.draft.start = ''
      this.draft.end = ''
      this.draft.groupBy = 'day'
      this.$router.push({ name: 'admin-dashboard', query: {} })
    },
  },
}
</script>

<style scoped>
.admin-dashboard {
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

.section-title {
  font-size: var(--text-lg);
  margin-bottom: var(--space-3);
}

.kpis {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  padding: 0;
  list-style: none;
}

.kpi {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.kpi__label {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.kpi__value {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 600;
}

.kpi__change {
  font-size: var(--text-sm);
  font-weight: 600;
}

.kpi__change--up { color: var(--color-success); }
.kpi__change--down { color: var(--color-danger); }
.kpi__change--neutral { color: var(--color-text-muted); }

.today {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
}

.today div {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.today dt {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.today dd {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
}

.table-wrap {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
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

.activity {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0;
  list-style: none;
}

.activity__item {
  display: grid;
  grid-template-columns: max-content max-content 1fr max-content;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: var(--text-sm);
}

.activity__type {
  font-weight: 700;
}
.charts-pair {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
}
</style>
