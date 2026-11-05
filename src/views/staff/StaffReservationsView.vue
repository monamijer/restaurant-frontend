<template>
  <div class="staff-reservations container">
    <StaffNav />

    <header class="head">
      <div>
        <h1>{{ $t('staff.reservations.title') }}</h1>
        <p class="muted">{{ $t('staff.reservations.subtitle') }}</p>
      </div>
      <p class="muted" role="status" aria-live="polite">
        {{ $t('staff.reservations.countLabel', { count }) }}
      </p>
    </header>

    <form class="filters cluster" @submit.prevent="applyFilters">
      <label class="field">
        <span>{{ $t('staff.reservations.filters.date') }}</span>
        <input v-model="draft.date" type="date" class="control" />
      </label>

      <label class="field">
        <span>{{ $t('staff.reservations.filters.status') }}</span>
        <select v-model="draft.status" class="control">
          <option value="">{{ $t('staff.reservations.filters.all') }}</option>
          <option v-for="s in statuses" :key="s" :value="s">
            {{ $t(`reservations.status.${s}`) }}
          </option>
        </select>
      </label>

      <BaseButton type="submit">{{ $t('staff.reservations.filters.apply') }}</BaseButton>
      <BaseButton type="button" variant="ghost" @click="clearFilters">
        {{ $t('staff.reservations.filters.clear') }}
      </BaseButton>
    </form>

    <FormAlert v-if="actionError" :message="actionError" />

    <EmptyState v-if="failed" :title="$t('staff.reservations.failed')">
      <BaseButton variant="secondary" @click="fetchList">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <ul v-else-if="loading && items.length === 0" class="list" aria-hidden="true">
      <li v-for="n in 4" :key="n"><BaseSkeleton height="4rem" /></li>
    </ul>

    <EmptyState v-else-if="items.length === 0" :title="$t('staff.reservations.empty')" />

    <ul v-else class="list">
      <li v-for="r in items" :key="r.id" class="card">
        <div>
          <p class="card__title">
            {{ r.table_number }} · {{ $t('reservations.party', { count: r.party_size }, r.party_size) }}
          </p>
          <p class="muted card__meta">
            {{ formatDay(r.date, locale) }} {{ r.time }} · {{ r.duration_minutes }} min
          </p>
          <p class="muted card__meta">
            {{ $t('staff.reservations.customer') }}: {{ r.customer || '—' }}
          </p>
        </div>

        <div class="card__end">
          <BaseBadge :tone="tone(r.status)">{{ $t(`reservations.status.${r.status}`) }}</BaseBadge>
          <div class="cluster actions">
            <BaseButton
              v-for="action in actionsFor(r)"
              :key="action.key"
              size="sm"
              :variant="action.variant"
              :loading="busyId === r.id"
              :disabled="busyId === r.id"
              @click="run(r, action.key)"
            >
              {{ $t(`staff.reservations.actions.${action.key}`) }}
            </BaseButton>
          </div>
        </div>
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
import FormAlert from '@/components/common/FormAlert.vue'
import StaffNav from '@/components/staff/StaffNav.vue'
import { staffReservationService } from '@/services/staffReservationService'
import { useUiStore } from '@/store/ui'
import { useToastStore } from '@/store/toasts'
import { describeError } from '@/utils/errors'
import { formatDay } from '@/utils/format'
import { reservationTone } from '@/utils/reservations'

const PAGE_SIZE = 20
const POLL_MS = 15000
const STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'no_show']

// Only the transitions documented for staff; the backend refuses the rest.
const TRANSITIONS = {
  pending: [
    { key: 'confirm', variant: 'primary' },
    { key: 'reject', variant: 'danger' },
  ],
  confirmed: [
    { key: 'complete', variant: 'primary' },
    { key: 'noShow', variant: 'secondary' },
    { key: 'cancel', variant: 'danger' },
  ],
}

export default {
  name: 'StaffReservationsView',
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
      draft: {
        date: this.$route.query.date || '',
        status: this.$route.query.status || '',
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
      if (this.$route.query.status) q.status = this.$route.query.status
      if (this.$route.query.date) q.date = this.$route.query.date
      return q
    },
  },
  watch: {
    '$route.fullPath'() {
      if (this.$route.name === 'staff-reservations') {
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
    tone: reservationTone,
    formatDay,

    actionsFor(reservation) {
      return TRANSITIONS[reservation.status] || []
    },

    syncDraft() {
      this.draft.date = this.$route.query.date || ''
      this.draft.status = this.$route.query.status || ''
    },

    async fetchList() {
      const id = ++this.requestId
      this.loading = true
      this.failed = false
      try {
        const page = await staffReservationService.list(this.query)
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
      if (this.draft.status) query.status = this.draft.status
      if (this.draft.date) query.date = this.draft.date
      this.$router.push({ name: 'staff-reservations', query })
    },

    clearFilters() {
      this.draft.date = ''
      this.draft.status = ''
      this.$router.push({ name: 'staff-reservations', query: {} })
    },

    goToPage(p) {
      const query = { ...this.$route.query }
      if (p > 1) query.page = String(p)
      else delete query.page
      this.$router.push({ name: 'staff-reservations', query })
    },

    async run(reservation, action) {
      if (this.busyId) return
      this.busyId = reservation.id
      this.actionError = ''
      try {
        await staffReservationService.act(reservation.id, action)
        useToastStore().success(this.$t('staff.reservations.updated'))
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
.staff-reservations {
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

.card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.card__title {
  font-weight: 700;
}

.card__meta {
  font-size: var(--text-sm);
}

.card__end {
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: var(--space-2);
}

.actions {
  flex-wrap: wrap;
  justify-content: end;
}
</style>
