<template>
  <div class="staff-order container">
    <StaffNav />

    <p>
      <RouterLink :to="{ name: 'staff-orders' }">← {{ $t('staff.order.back') }}</RouterLink>
    </p>

    <p v-if="loading && !order" class="muted" role="status">{{ $t('staff.order.loading') }}</p>

    <EmptyState v-else-if="failed" :title="$t('staff.order.failed')">
      <BaseButton variant="secondary" @click="load">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <EmptyState v-else-if="notFound" :title="$t('staff.order.notFound')" />

    <template v-else-if="order">
      <header class="head">
        <h1>{{ $t('staff.order.title', { id: order.id }) }}</h1>
        <BaseBadge :tone="tone(order.status)">{{ $t(`orders.status.${order.status}`) }}</BaseBadge>
      </header>

      <div class="grid">
        <section class="panel">
          <h2>{{ $t('staff.order.summaryTitle') }}</h2>
          <dl class="meta">
            <dt>{{ $t('staff.order.meta.type') }}</dt>
            <dd>{{ $t(`orders.types.${order.order_type}`) }}</dd>

            <dt>{{ $t('staff.order.meta.table') }}</dt>
            <dd>{{ order.table_number || '—' }}</dd>

            <dt>{{ $t('staff.order.meta.customer') }}</dt>
            <dd>{{ order.customer_name || '—' }}</dd>

            <dt>{{ $t('staff.order.meta.phone') }}</dt>
            <dd>{{ order.contact_phone || '—' }}</dd>

            <dt v-if="order.delivery_address">{{ $t('staff.order.meta.address') }}</dt>
            <dd v-if="order.delivery_address">{{ order.delivery_address }}</dd>

            <dt>{{ $t('staff.order.meta.createdAt') }}</dt>
            <dd>{{ date(order.created_at) }}</dd>

            <dt>{{ $t('staff.order.meta.updatedAt') }}</dt>
            <dd>{{ date(order.updated_at) }}</dd>

            <dt v-if="order.notes">{{ $t('staff.order.meta.notes') }}</dt>
            <dd v-if="order.notes">{{ order.notes }}</dd>
          </dl>
        </section>

        <section class="panel">
          <h2>{{ $t('staff.order.itemsTitle') }}</h2>
          <ul class="items">
            <li v-for="item in order.items" :key="item.id" class="item">
              <div>
                <p class="item__name">{{ item.item_name }}</p>
                <p class="muted item__meta">
                  {{ $t('staff.order.items.quantity', { count: item.quantity }) }} ·
                  {{ money(item.unit_price) }}
                </p>
                <p v-if="item.special_instructions" class="muted item__meta">
                  {{ $t('staff.order.items.note', { note: item.special_instructions }) }}
                </p>
              </div>
              <span class="item__total">{{ money(item.subtotal) }}</span>
            </li>
          </ul>

          <dl class="totals">
            <dt>{{ $t('staff.order.totals.subtotal') }}</dt>
            <dd>{{ money(order.subtotal) }}</dd>

            <dt>{{ $t('staff.order.totals.tax', { rate: order.tax_rate }) }}</dt>
            <dd>{{ money(order.tax_amount) }}</dd>

            <dt class="totals__grand">{{ $t('staff.order.totals.total') }}</dt>
            <dd class="totals__grand">{{ money(order.total) }}</dd>
          </dl>
        </section>
      </div>

      <section class="panel">
        <h2>{{ $t('staff.order.actionsTitle') }}</h2>
        <p class="muted">{{ $t('staff.order.actionsHint') }}</p>

        <FormAlert v-if="actionError" :message="actionError" />

        <div class="cluster">
          <BaseButton
            v-if="nextStatus"
            :loading="busy"
            :disabled="busy"
            @click="advance"
          >
            {{ $t('staff.order.advanceTo', { status: $t(`orders.status.${nextStatus}`) }) }}
          </BaseButton>

          <BaseButton
            v-if="pendingCash"
            variant="secondary"
            :loading="busy"
            :disabled="busy"
            @click="askConfirmCash"
          >
            {{ $t('staff.order.confirmCash') }}
          </BaseButton>

          <BaseButton
            v-if="invoice"
            variant="ghost"
            @click="downloadInvoice"
          >
            {{ $t('staff.order.invoice') }}
          </BaseButton>

          <p v-if="!nextStatus && !pendingCash" class="muted">{{ $t('staff.order.noActions') }}</p>
        </div>

        <p v-if="!invoice" class="muted invoice-hint">{{ $t('staff.order.invoiceMissing') }}</p>
      </section>
    </template>

    <ConfirmDialog
      :open="confirmCashOpen"
      :title="$t('staff.order.confirmCash')"
      :message="$t('staff.order.confirmCashQuestion')"
      :confirm-label="$t('common.confirm')"
      :cancel-label="$t('common.cancel')"
      :loading="busy"
      @confirm="confirmCash"
      @cancel="confirmCashOpen = false"
    />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import StaffNav from '@/components/staff/StaffNav.vue'
import { CURRENCY } from '@/config'
import { invoiceService } from '@/services/invoiceService'
import staffOrderService from '@/services/staffOrderService'
import staffPaymentService from '@/services/staffPaymentService'
import { useUiStore } from '@/store/ui'
import { describeError } from '@/utils/errors'
import { formatDateTime, formatMoney } from '@/utils/format'
import { orderStatusTone } from '@/utils/orders'
import { saveBlob } from '@/utils/download'

const SEQUENCE = ['pending', 'confirmed', 'preparing', 'ready', 'completed']
const POLL_MS = 15000

export default {
  name: 'StaffOrderView',
  components: { BaseBadge, BaseButton, ConfirmDialog, EmptyState, FormAlert, StaffNav },
  data() {
    return {
      order: null,
      payments: [],
      invoices: [],
      loading: false,
      failed: false,
      notFound: false,
      busy: false,
      actionError: '',
      confirmCashOpen: false,
      timer: null,
      requestId: 0,
    }
  },
  computed: {
    ...mapState(useUiStore, ['locale']),
    nextStatus() {
      if (!this.order) return null
      const index = SEQUENCE.indexOf(this.order.status)
      if (index === -1 || index === SEQUENCE.length - 1) return null
      return SEQUENCE[index + 1]
    },
    pendingCash() {
      return this.payments.find((p) => p.method === 'cash' && p.status === 'pending') || null
    },
    invoice() {
      return this.invoices[0] || null
    },
  },
  created() {
    this.load()
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

    async load() {
      const id = ++this.requestId
      this.loading = true
      this.failed = false
      this.notFound = false
      try {
        const order = await staffOrderService.get(this.$route.params.id)
        if (id !== this.requestId) return
        this.order = order
        await this.loadRelated()
      } catch (error) {
        if (id !== this.requestId) return
        if (error?.status === 404) this.notFound = true
        else this.failed = true
      } finally {
        if (id === this.requestId) this.loading = false
      }
    },

    async loadRelated() {
      if (!this.order) return
      const [paymentsPage, invoice] = await Promise.all([
        staffPaymentService.listForOrder(this.order.id),
        invoiceService.forOrder(this.order.id),
      ])
      this.payments = paymentsPage.results
      this.invoices = invoice ? [invoice] : []
    },

    tick() {
      if (document.hidden) return
      if (this.busy || this.loading) return
      this.refresh()
    },

    async refresh() {
      try {
        this.order = await staffOrderService.get(this.$route.params.id)
        await this.loadRelated()
      } catch {
        // keep what is on screen
      }
    },

    async advance() {
      if (this.busy || !this.nextStatus) return
      this.busy = true
      this.actionError = ''
      try {
        this.order = await staffOrderService.updateStatus(this.order.id, this.nextStatus)
        await this.loadRelated()
      } catch (error) {
        this.actionError = describeError(error, this.$t.bind(this))
      } finally {
        this.busy = false
      }
    },

    askConfirmCash() {
      this.actionError = ''
      this.confirmCashOpen = true
    },

    async confirmCash() {
      if (this.busy || !this.pendingCash) return
      this.busy = true
      this.actionError = ''
      try {
        await staffPaymentService.confirm(this.pendingCash.id)
        this.confirmCashOpen = false
        await this.loadRelated()
      } catch (error) {
        this.confirmCashOpen = false
        this.actionError = describeError(error, this.$t.bind(this))
      } finally {
        this.busy = false
      }
    },

    async downloadInvoice() {
      if (!this.invoice) return
      const blob = await invoiceService.downloadPdf(this.invoice.id)
      saveBlob(blob, `invoice-${this.invoice.invoice_number}.pdf`)
    },
  },
}
</script>

<style scoped>
.staff-order {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-6);
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.grid {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
}

.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.panel h2 {
  font-size: var(--text-lg);
}

.meta {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
}

.meta dt {
  color: var(--color-text-muted);
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
  gap: var(--space-3);
  padding-block: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

.item:last-child {
  border-bottom: none;
}

.item__name {
  font-weight: 600;
}

.item__meta {
  font-size: var(--text-sm);
}

.item__total {
  font-family: var(--font-display);
  font-weight: 600;
  white-space: nowrap;
}

.totals {
  display: grid;
  grid-template-columns: 1fr max-content;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.totals dd {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.totals__grand {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}

.invoice-hint {
  font-size: var(--text-sm);
}
</style>
