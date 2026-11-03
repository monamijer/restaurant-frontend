<template>
  <div class="order container">
    <router-link class="order__back" :to="{ name: 'orders' }">
      <span aria-hidden="true">←</span> {{ $t('order.back') }}
    </router-link>

    <div v-if="loading" class="stack" aria-hidden="true">
      <BaseSkeleton width="50%" height="2rem" />
      <BaseSkeleton height="4rem" />
      <BaseSkeleton />
    </div>

    <EmptyState v-else-if="notFound" :title="$t('order.notFoundTitle')" :description="$t('order.notFoundText')">
      <BaseButton :to="{ name: 'orders' }">{{ $t('order.back') }}</BaseButton>
    </EmptyState>

    <EmptyState v-else-if="failed" :title="$t('order.errorTitle')" :description="$t('menu.errorText')">
      <BaseButton variant="secondary" @click="load">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <template v-else>
      <header class="order__header">
        <div>
          <p class="eyebrow">
            {{ $t(`orders.types.${order.order_type}`) }}
            <template v-if="order.table_number"> · {{ $t('order.table', { number: order.table_number }) }}</template>
          </p>
          <h1>{{ $t('order.heading', { id: order.id }) }}</h1>
          <p class="muted">{{ $t('order.placedAt', { date: placedAt }) }}</p>
        </div>
        <BaseBadge :tone="tone">{{ $t(`orders.status.${order.status}`) }}</BaseBadge>
      </header>

      <p v-if="cancelled" class="order__cancelled" role="status">{{ $t('order.cancelledNote') }}</p>
      <template v-else>
        <OrderTimeline :status="order.status" />
        <p v-if="!finished" class="order__live muted">{{ $t('order.live') }}</p>
      </template>

      <div class="order__layout">
        <section class="order__items" aria-labelledby="items-title">
          <h2 id="items-title" class="order__title">{{ $t('order.items') }}</h2>
          <ul class="items">
            <li v-for="item in order.items" :key="item.id" class="item">
              <div>
                <p class="item__name">{{ item.quantity }} × {{ item.item_name }}</p>
                <p class="muted item__each">{{ $t('order.each', { price: money(item.unit_price) }) }}</p>
                <p v-if="item.special_instructions" class="item__note">{{ item.special_instructions }}</p>
              </div>
              <p class="item__total">{{ money(item.subtotal) }}</p>
            </li>
          </ul>

          <dl class="totals">
            <div>
              <dt>{{ $t('order.subtotal') }}</dt>
              <dd>{{ money(order.subtotal) }}</dd>
            </div>
            <div>
              <dt>{{ $t('order.tax', { rate: taxPercent }) }}</dt>
              <dd>{{ money(order.tax_amount) }}</dd>
            </div>
            <div class="totals__total">
              <dt>{{ $t('order.total') }}</dt>
              <dd>{{ money(order.total) }}</dd>
            </div>
          </dl>
        </section>

        <aside class="order__side">
          <dl v-if="hasDetails" class="details">
            <div v-if="order.delivery_address">
              <dt>{{ $t('order.deliveryTo') }}</dt>
              <dd>{{ order.delivery_address }}</dd>
            </div>
            <div v-if="order.contact_phone">
              <dt>{{ $t('order.phone') }}</dt>
              <dd>{{ order.contact_phone }}</dd>
            </div>
            <div v-if="order.notes">
              <dt>{{ $t('order.notes') }}</dt>
              <dd>{{ order.notes }}</dd>
            </div>
          </dl>

          <PaymentPanel v-if="!cancelled" :order="order" :payments="payments" @changed="refresh" />

          <BaseButton v-if="canCancel" variant="ghost" @click="confirmOpen = true">{{ $t('order.cancel') }}</BaseButton>
        </aside>
      </div>
    </template>

    <ConfirmDialog
      :open="confirmOpen"
      danger
      :loading="cancelling"
      :title="$t('order.cancelTitle')"
      :message="$t('order.cancelMessage')"
      :confirm-label="$t('order.cancelConfirm')"
      :cancel-label="$t('order.cancelKeep')"
      @cancel="confirmOpen = false"
      @confirm="cancelOrder"
    />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import OrderTimeline from '@/components/orders/OrderTimeline.vue'
import PaymentPanel from '@/components/orders/PaymentPanel.vue'
import { CURRENCY } from '@/config'
import { orderService } from '@/services/orderService'
import { paymentService } from '@/services/paymentService'
import { useToastStore } from '@/store/toasts'
import { useUiStore } from '@/store/ui'
import { describeError, toApiError } from '@/utils/errors'
import { formatDateTime, formatMoney } from '@/utils/format'
import { isFinished, orderStatusTone } from '@/utils/orders'

export const POLL_INTERVAL_MS = 10000

export default {
  name: 'OrderView',
  components: { BaseBadge, BaseButton, BaseSkeleton, ConfirmDialog, EmptyState, OrderTimeline, PaymentPanel },
  data() {
    return {
      order: null,
      payments: [],
      loading: true,
      notFound: false,
      failed: false,
      confirmOpen: false,
      cancelling: false,
      timer: null,
    }
  },
  computed: {
    ...mapState(useUiStore, ['locale']),
    cancelled() {
      return this.order.status === 'cancelled'
    },
    finished() {
      return isFinished(this.order.status)
    },
    tone() {
      return orderStatusTone(this.order.status)
    },
    placedAt() {
      return formatDateTime(this.order.created_at, this.locale)
    },
    taxPercent() {
      return String(Number(this.order.tax_rate))
    },
    hasDetails() {
      return Boolean(this.order.delivery_address || this.order.contact_phone || this.order.notes)
    },
    hasPaid() {
      return this.payments.some((payment) => payment.status === 'paid')
    },
    // A customer can only cancel an order the restaurant has not started and that is not paid.
    canCancel() {
      return this.order.status === 'pending' && !this.hasPaid
    },
    settled() {
      return this.finished && !this.payments.some((payment) => payment.status === 'pending')
    },
  },
  created() {
    this.load()
  },
  mounted() {
    // The kitchen moves the order along: keep this page current without a reload.
    this.timer = setInterval(this.tick, POLL_INTERVAL_MS)
  },
  beforeUnmount() {
    clearInterval(this.timer)
  },
  methods: {
    ...mapActions(useToastStore, ['success', 'error']),

    money(amount) {
      return formatMoney(amount, CURRENCY, this.locale)
    },

    async fetchAll() {
      const id = this.$route.params.id
      const [order, payments] = await Promise.all([orderService.get(id), paymentService.forOrder(id)])
      this.order = order
      this.payments = payments
    },

    async load() {
      this.loading = true
      this.notFound = false
      this.failed = false
      try {
        await this.fetchAll()
      } catch (error) {
        if (toApiError(error).status === 404) this.notFound = true
        else this.failed = true
      } finally {
        this.loading = false
      }
    },

    /** A quiet reload: a failure keeps what is on screen instead of replacing it with an error. */
    async refresh() {
      try {
        await this.fetchAll()
      } catch {
        // The next tick tries again.
      }
    },

    tick() {
      if (document.hidden || !this.order || this.settled) return
      this.refresh()
    },

    async cancelOrder() {
      this.cancelling = true
      try {
        await orderService.cancel(this.order.id)
        this.success(this.$t('order.cancelled'))
        await this.refresh()
      } catch (error) {
        this.error(describeError(error, (key) => this.$t(key)))
      } finally {
        this.cancelling = false
        this.confirmOpen = false
      }
    },
  },
}
</script>

<style scoped>
.order {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-6) var(--space-7);
}

.order__back {
  align-self: flex-start;
  font-weight: 600;
}

.order__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.order__cancelled {
  padding: var(--space-3) var(--space-4);
  font-weight: 600;
  color: var(--color-danger);
  background: var(--color-danger-surface);
  border-inline-start: 4px solid var(--color-danger);
  border-radius: var(--radius-sm);
}

.order__live {
  font-size: var(--text-sm);
  text-align: center;
}

.order__layout {
  display: grid;
  gap: var(--space-6);
}

.order__title {
  margin-bottom: var(--space-3);
  font-size: var(--text-xl);
}

.items {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0;
  list-style: none;
}

.item {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.item__name {
  font-weight: 600;
}

.item__each,
.item__note {
  font-size: var(--text-sm);
}

.item__note {
  font-style: italic;
}

.item__total {
  white-space: nowrap;
}

.totals {
  display: grid;
  gap: var(--space-2);
  margin: var(--space-4) 0 0;
}

.totals div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.totals dd {
  margin: 0;
}

.totals__total {
  padding-top: var(--space-3);
  font-size: var(--text-lg);
  font-weight: 700;
  border-top: 1px solid var(--color-border);
}

.order__side {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.details {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-4);
  background: var(--color-surface-sunken);
  border-radius: var(--radius-md);
}

.details dt {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.details dd {
  margin: 0;
}

@media (min-width: 56em) {
  .order__layout {
    grid-template-columns: 1fr 24rem;
    align-items: start;
  }
}
</style>
