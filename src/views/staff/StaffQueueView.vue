<template>
  <div class="staff-queue container">
    <StaffNav />

    <header class="head">
      <div>
        <h1>{{ $t('staff.queue.title') }}</h1>
        <p class="muted">{{ $t('staff.queue.subtitle') }}</p>
      </div>
      <p class="muted" role="status" aria-live="polite">
        {{ $t('staff.queue.countLabel', { count }) }}
      </p>
    </header>

    <div class="cluster">
      <BaseButton :loading="callingNext" :disabled="callingNext || busyId !== null" @click="callNext">
        {{ $t('staff.queue.callNext') }}
      </BaseButton>
      <BaseButton variant="ghost" type="button" @click="fetchList">
        {{ $t('staff.common.refresh') }}
      </BaseButton>
    </div>

    <form class="filters cluster" @submit.prevent="applyFilters">
      <label class="field">
        <span>{{ $t('staff.queue.filters.status') }}</span>
        <select v-model="draft.status" class="control">
          <option value="">{{ $t('staff.queue.filters.all') }}</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ $t(`queue.status.${s}`) }}</option>
        </select>
      </label>

      <label class="field field--check">
        <input v-model="draft.active" type="checkbox" />
        <span>{{ $t('staff.queue.filters.active') }}</span>
      </label>

      <BaseButton type="submit">{{ $t('staff.queue.filters.apply') }}</BaseButton>
      <BaseButton type="button" variant="ghost" @click="clearFilters">
        {{ $t('staff.queue.filters.clear') }}
      </BaseButton>
    </form>

    <FormAlert v-if="actionError" :message="actionError" />

    <EmptyState v-if="failed" :title="$t('staff.queue.failed')">
      <BaseButton variant="secondary" @click="fetchList">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <ul v-else-if="loading && items.length === 0" class="list" aria-hidden="true">
      <li v-for="n in 4" :key="n"><BaseSkeleton height="3.5rem" /></li>
    </ul>

    <EmptyState v-else-if="items.length === 0" :title="$t('staff.queue.empty')" />

    <ul v-else class="list">
      <li
        v-for="ticket in items"
        :key="ticket.id"
        class="card"
        :class="{ 'card--called': ticket.status === 'called' }"
      >
        <div>
          <p class="card__title">
            {{ $t('queue.guests', { count: ticket.party_size }, ticket.party_size) }}
            <span v-if="ticket.phone" class="muted card__phone"> · {{ ticket.phone }}</span>
          </p>
          <p class="muted card__meta">
            {{ $t('staff.queue.positionLabel', { position: ticket.position }) }}
            · {{ $t('staff.queue.waitLabel', { minutes: ticket.estimated_wait_minutes }) }}
          </p>
        </div>

        <div class="card__end">
          <BaseBadge :tone="tone(ticket.status)">{{ $t(`queue.status.${ticket.status}`) }}</BaseBadge>
          <div class="cluster actions">
            <BaseButton
              v-for="action in actionsFor(ticket)"
              :key="action.key"
              size="sm"
              :variant="action.variant"
              :loading="busyId === ticket.id"
              :disabled="busyId === ticket.id || callingNext"
              @click="run(ticket, action.key)"
            >
              {{ $t(`staff.queue.actions.${action.key}`) }}
            </BaseButton>
          </div>
        </div>
      </li>
    </ul>

    <BasePagination :page="page" :total-pages="pages" @change="goToPage" />

    <ConfirmDialog
      :open="dialog.open"
      danger
      :title="dialog.title"
      :message="dialog.message"
      :confirm-label="dialog.confirmLabel"
      :cancel-label="$t('common.cancel')"
      :loading="busyId !== null"
      @cancel="closeDialog"
      @confirm="confirmDialog"
    />
  </div>
</template>

<script>
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import StaffNav from '@/components/staff/StaffNav.vue'
import { staffQueueService } from '@/services/staffQueueService'
import { useToastStore } from '@/store/toasts'
import { describeError } from '@/utils/errors'
import { queueTone } from '@/utils/reservations'

const PAGE_SIZE = 20
const POLL_MS = 10000
const STATUSES = ['waiting', 'called', 'seated', 'cancelled', 'no_show']

const TRANSITIONS = {
  waiting: [
    { key: 'call', variant: 'primary' },
    { key: 'cancel', variant: 'danger' },
  ],
  called: [
    { key: 'seat', variant: 'primary' },
    { key: 'noShow', variant: 'danger' },
    { key: 'cancel', variant: 'danger' },
  ],
}

const ACTIONS = {
  call: (id) => staffQueueService.call(id),
  seat: (id) => staffQueueService.seat(id),
  noShow: (id) => staffQueueService.noShow(id),
  cancel: (id) => staffQueueService.cancel(id),
}

const DESTRUCTIVE = {
  noShow: {
    titleKey: 'staff.queue.noShowTitle',
    messageKey: 'staff.queue.noShowMessage',
    confirmKey: 'staff.queue.noShowConfirm',
  },
  cancel: {
    titleKey: 'staff.queue.cancelTitle',
    messageKey: 'staff.queue.cancelMessage',
    confirmKey: 'staff.queue.cancelConfirm',
  },
}

export default {
  name: 'StaffQueueView',
  components: {
    BaseBadge, BaseButton, BasePagination, BaseSkeleton, ConfirmDialog, EmptyState, FormAlert, StaffNav,
  },
  data() {
    return {
      items: [],
      count: 0,
      loading: false,
      failed: false,
      busyId: null,
      callingNext: false,
      actionError: '',
      requestId: 0,
      timer: null,
      statuses: STATUSES,
      draft: {
        status: this.$route.query.status || '',
        active: this.$route.query.active === '1',
      },
      dialog: { open: false, ticket: null, action: null, title: '', message: '', confirmLabel: '' },
    }
  },
  computed: {
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
      if (this.$route.query.active === '1') q.active = true
      return q
    },
  },
  watch: {
    '$route.fullPath'() {
      if (this.$route.name === 'staff-queue') {
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
    tone: queueTone,

    actionsFor(ticket) {
      return TRANSITIONS[ticket.status] || []
    },

    syncDraft() {
      this.draft.status = this.$route.query.status || ''
      this.draft.active = this.$route.query.active === '1'
    },

    async fetchList() {
      const id = ++this.requestId
      this.loading = true
      this.failed = false
      try {
        const page = await staffQueueService.list(this.query)
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
      if (document.hidden || this.loading || this.busyId || this.callingNext) return
      this.fetchList()
    },

    applyFilters() {
      const query = {}
      if (this.draft.status) query.status = this.draft.status
      if (this.draft.active) query.active = '1'
      this.$router.push({ name: 'staff-queue', query })
    },

    clearFilters() {
      this.draft.status = ''
      this.draft.active = false
      this.$router.push({ name: 'staff-queue', query: {} })
    },

    goToPage(p) {
      const query = { ...this.$route.query }
      if (p > 1) query.page = String(p)
      else delete query.page
      this.$router.push({ name: 'staff-queue', query })
    },

    async callNext() {
      if (this.callingNext) return
      this.callingNext = true
      this.actionError = ''
      try {
        await staffQueueService.callNext()
        useToastStore().success(this.$t('staff.queue.called'))
        await this.fetchList()
      } catch (error) {
        this.actionError = describeError(error, this.$t.bind(this))
      } finally {
        this.callingNext = false
      }
    },

    run(ticket, action) {
      if (this.busyId) return
      if (DESTRUCTIVE[action]) {
        this.dialog = {
          open: true,
          ticket,
          action,
          title: this.$t(DESTRUCTIVE[action].titleKey),
          message: this.$t(DESTRUCTIVE[action].messageKey),
          confirmLabel: this.$t(DESTRUCTIVE[action].confirmKey),
        }
        return
      }
      this.perform(ticket, action)
    },

    async confirmDialog() {
      const { ticket, action } = this.dialog
      await this.perform(ticket, action)
      if (!this.actionError) this.closeDialog()
    },

    closeDialog() {
      this.dialog = { open: false, ticket: null, action: null, title: '', message: '', confirmLabel: '' }
    },

    async perform(ticket, action) {
      if (this.busyId) return
      const call = ACTIONS[action]
      if (!call) {
        this.actionError = `Unknown queue action: ${action}`
        return
      }
      this.busyId = ticket.id
      this.actionError = ''
      try {
        await call(ticket.id)
        useToastStore().success(this.$t('staff.queue.updated'))
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
.staff-queue {
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

.card--called {
  border-color: var(--color-success);
  box-shadow: 0 0 0 2px var(--color-success);
}

.card__title {
  font-weight: 700;
}

.card__phone {
  font-weight: 400;
  font-size: var(--text-sm);
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
