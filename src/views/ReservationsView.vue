<template>
  <div class="reservations container">
    <header class="reservations__header">
      <h1>{{ $t('reservations.heading') }}</h1>
      <BaseButton :to="{ name: 'reservation-new' }">{{ $t('reservations.book') }}</BaseButton>
    </header>

    <EmptyState v-if="failed" :title="$t('reservations.errorTitle')" :description="$t('menu.errorText')">
      <BaseButton variant="secondary" @click="fetchReservations">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <ul v-else-if="loading && reservations.length === 0" class="list" aria-hidden="true">
      <li v-for="n in 3" :key="n" class="row"><BaseSkeleton height="3rem" /></li>
    </ul>

    <EmptyState
      v-else-if="reservations.length === 0"
      :title="$t('reservations.emptyTitle')"
      :description="$t('reservations.emptyText')"
    >
      <BaseButton :to="{ name: 'reservation-new' }">{{ $t('reservations.book') }}</BaseButton>
    </EmptyState>

    <ul v-else class="list">
      <li v-for="reservation in reservations" :key="reservation.id" class="row">
        <div>
          <p class="row__when">{{ day(reservation.date) }} · {{ reservation.time }}</p>
          <p class="muted row__meta">
            {{ $t('reservations.party', { count: reservation.party_size }, reservation.party_size) }} ·
            {{ $t('reservations.table', { number: reservation.table_number }) }}
          </p>
          <p v-if="reservation.notes" class="row__notes">{{ reservation.notes }}</p>
          <p v-if="reservation.status === 'pending' && reservation.expires_at" class="muted row__meta">
            {{ $t('reservations.heldUntil', { time: heldUntil(reservation.expires_at) }) }}
          </p>
        </div>
        <div class="row__end">
          <BaseBadge :tone="tone(reservation.status)">{{ $t(`reservations.status.${reservation.status}`) }}</BaseBadge>
          <BaseButton
            v-if="canCancel(reservation.status)"
            variant="ghost"
            size="sm"
            :aria-label="$t('reservations.cancelLabel', { date: day(reservation.date), time: reservation.time })"
            @click="target = reservation"
          >
            {{ $t('reservations.cancel') }}
          </BaseButton>
        </div>
      </li>
    </ul>

    <BasePagination :page="page" :total-pages="pages" @change="goToPage" />

    <ConfirmDialog
      :open="target !== null"
      danger
      :loading="cancelling"
      :title="$t('reservations.cancelTitle')"
      :message="$t('reservations.cancelMessage')"
      :confirm-label="$t('reservations.cancelConfirm')"
      :cancel-label="$t('reservations.cancelKeep')"
      @cancel="target = null"
      @confirm="cancelTarget"
    />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { reservationService } from '@/services/reservationService'
import { useRestaurantStore } from '@/store/restaurant'
import { useToastStore } from '@/store/toasts'
import { useUiStore } from '@/store/ui'
import { describeError } from '@/utils/errors'
import { formatDay } from '@/utils/format'
import { canCancelReservation, reservationTone } from '@/utils/reservations'

const PAGE_SIZE = 10

export default {
  name: 'ReservationsView',
  components: { BaseBadge, BaseButton, BasePagination, BaseSkeleton, ConfirmDialog, EmptyState },
  data() {
    return { reservations: [], count: 0, loading: false, failed: false, requestId: 0, target: null, cancelling: false }
  },
  computed: {
    ...mapState(useUiStore, ['locale']),
    ...mapState(useRestaurantStore, ['settings']),
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
      if (this.$route.name === 'reservations') this.fetchReservations()
    },
  },
  created() {
    this.fetchReservations()
  },
  methods: {
    ...mapActions(useToastStore, ['success', 'error']),
    tone: reservationTone,
    canCancel: canCancelReservation,

    day(date) {
      return formatDay(date, this.locale)
    },

    heldUntil(iso) {
      return new Intl.DateTimeFormat(this.locale, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: this.settings?.timezone || undefined,
      }).format(new Date(iso))
    },

    async fetchReservations() {
      const id = ++this.requestId
      this.loading = true
      this.failed = false
      try {
        const page = await reservationService.list({ page: this.page, page_size: PAGE_SIZE, ordering: '-starts_at' })
        if (id !== this.requestId) return
        this.reservations = page.results
        this.count = page.count
      } catch {
        if (id === this.requestId) this.failed = true
      } finally {
        if (id === this.requestId) this.loading = false
      }
    },

    async cancelTarget() {
      this.cancelling = true
      try {
        await reservationService.cancel(this.target.id)
        this.success(this.$t('reservations.cancelled'))
        await this.fetchReservations()
      } catch (error) {
        this.error(describeError(error, (key) => this.$t(key)))
      } finally {
        this.cancelling = false
        this.target = null
      }
    },

    goToPage(page) {
      this.$router.push({ name: 'reservations', query: page > 1 ? { page: String(page) } : {} })
    },
  },
}
</script>

<style scoped>
.reservations {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-7) var(--space-6);
}

.reservations__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.row__when {
  font-weight: 700;
}

.row__meta {
  font-size: var(--text-sm);
}

.row__notes {
  font-size: var(--text-sm);
  font-style: italic;
}

.row__end {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
</style>
