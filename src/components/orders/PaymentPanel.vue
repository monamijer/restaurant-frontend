<template>
  <section class="payment" aria-labelledby="payment-title">
    <h2 id="payment-title" class="payment__title">{{ $t('payment.title') }}</h2>

    <template v-if="active && active.status === 'paid'">
      <p class="payment__line">
        <BaseBadge tone="success">{{ $t('payment.paid') }}</BaseBadge>
        <span>{{ $t('payment.paidAt', { date: paidAt }) }}</span>
      </p>
      <p class="muted payment__reference">{{ $t('payment.reference', { reference: active.reference }) }}</p>
    </template>

    <template v-else-if="active">
      <p class="payment__line" role="status">
        <BaseBadge tone="warning">{{ $t('payment.status.pending') }}</BaseBadge>
        <span>{{ $t('payment.pendingCash') }}</span>
      </p>
      <p class="muted payment__reference">{{ $t('payment.reference', { reference: active.reference }) }}</p>
      <BaseButton variant="secondary" size="sm" :loading="working" @click="cancelPayment">
        {{ $t('payment.changeMethod') }}
      </BaseButton>
    </template>

    <form v-else class="stack" novalidate @submit.prevent="pay">
      <FormAlert v-if="formError">{{ formError }}</FormAlert>
      <FormAlert v-else-if="latest && latest.status === 'failed'">{{ $t('payment.declined') }}</FormAlert>

      <fieldset class="payment__methods">
        <legend class="payment__legend">{{ $t('payment.method') }}</legend>
        <label v-for="option in methods" :key="option" class="method" :class="{ 'method--active': method === option }">
          <input v-model="method" type="radio" name="payment-method" :value="option" />
          <span class="method__text">
            <strong>{{ $t(`payment.methods.${option}`) }}</strong>
            <span class="muted">{{ $t(`payment.methodHints.${option}`) }}</span>
          </span>
        </label>
      </fieldset>

      <template v-if="method !== 'cash'">
        <p class="muted payment__demo">{{ $t('payment.demoNote') }}</p>
        <label v-if="canSimulateDecline" class="payment__decline">
          <input v-model="decline" type="checkbox" />
          <span>{{ $t('payment.declineOption') }}</span>
        </label>
      </template>

      <BaseButton type="submit" block size="lg" :loading="working">
        {{ $t('payment.pay', { amount: totalLabel }) }}
      </BaseButton>
    </form>
  </section>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import { CURRENCY } from '@/config'
import formErrors from '@/mixins/formErrors'
import { paymentService } from '@/services/paymentService'
import { useToastStore } from '@/store/toasts'
import { useUiStore } from '@/store/ui'
import { formatDateTime, formatMoney } from '@/utils/format'

const METHODS = ['cash', 'card', 'mobile_money']

// The simulated gateway refuses exactly this token and approves any other. A real provider
// would hand the page its own token after the customer enters their details with the
// provider's secure form: card numbers never pass through this application.
const DECLINED_TOKEN = 'tok_declined'

export default {
  name: 'PaymentPanel',
  components: { BaseBadge, BaseButton, FormAlert },
  mixins: [formErrors],
  props: {
    order: { type: Object, required: true },
    payments: { type: Array, default: () => [] },
  },
  emits: ['changed'],
  data() {
    return {
      methods: METHODS,
      method: 'cash',
      decline: false,
      working: false,
      canSimulateDecline: import.meta.env.DEV,
    }
  },
  computed: {
    ...mapState(useUiStore, ['locale']),
    latest() {
      return this.payments[0] ?? null
    },
    // A pending or paid payment blocks a new one; a failed one does not.
    active() {
      return this.payments.find((payment) => payment.status === 'pending' || payment.status === 'paid') ?? null
    },
    paidAt() {
      return formatDateTime(this.active?.paid_at, this.locale)
    },
    totalLabel() {
      return formatMoney(this.order.total, CURRENCY, this.locale)
    },
  },
  methods: {
    ...mapActions(useToastStore, ['success', 'info', 'error']),

    async pay() {
      if (this.working) return // Never charge twice for one click.
      this.clearErrors()
      this.working = true
      try {
        const token = this.method === 'cash' ? '' : this.decline ? DECLINED_TOKEN : `tok_demo_${this.method}`
        const payment = await paymentService.pay({ order: this.order.id, method: this.method, token })
        if (payment.status === 'paid') this.success(this.$t('payment.received'))
        else if (payment.status === 'pending') this.info(this.$t('payment.cashRegistered'))
        // A declined payment is a recorded answer, not an error: the panel explains it.
        this.$emit('changed')
      } catch (error) {
        this.showApiError(error)
      } finally {
        this.working = false
      }
    },

    async cancelPayment() {
      this.working = true
      try {
        await paymentService.cancel(this.active.id)
        this.$emit('changed')
      } catch (error) {
        this.error(this.$t('errors.unknown'))
        this.showApiError(error)
      } finally {
        this.working = false
      }
    },
  },
}
</script>

<style scoped>
.payment {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.payment__title {
  font-size: var(--text-xl);
}

.payment__line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.payment__reference,
.payment__demo {
  font-size: var(--text-sm);
}

.payment__methods {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  padding: 0;
  border: 0;
}

.payment__legend {
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
}

.method {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
}

.method--active {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.method input,
.payment__decline input {
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.15rem;
  accent-color: var(--color-primary);
}

.method__text {
  display: flex;
  flex-direction: column;
  font-size: var(--text-sm);
}

.payment__decline {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
}
</style>
