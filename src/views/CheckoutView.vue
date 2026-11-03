<template>
  <div class="checkout container">
    <header class="checkout__header">
      <p class="eyebrow">{{ $t('checkout.eyebrow') }}</p>
      <h1>{{ $t('checkout.heading') }}</h1>
    </header>

    <EmptyState v-if="isEmpty" :title="$t('checkout.emptyTitle')" :description="$t('checkout.emptyText')">
      <BaseButton :to="{ name: 'menu' }">{{ $t('checkout.emptyAction') }}</BaseButton>
    </EmptyState>

    <div v-else class="checkout__layout">
      <form class="checkout__form stack" novalidate @submit.prevent="submit">
        <FormAlert v-if="formError">{{ formError }}</FormAlert>

        <fieldset class="types">
          <legend class="types__legend">{{ $t('checkout.type') }}</legend>
          <label
            v-for="type in types"
            :key="type"
            class="type"
            :class="{ 'type--active': orderType === type }"
          >
            <input v-model="orderType" type="radio" name="order-type" :value="type" />
            <span class="type__text">
              <strong>{{ $t(`checkout.types.${type}`) }}</strong>
              <span class="muted">{{ $t(`checkout.typeHints.${type}`) }}</span>
            </span>
          </label>
          <p v-if="errors.type" class="field__error">{{ errors.type }}</p>
        </fieldset>

        <section v-if="orderType === 'dine_in'" class="table-box" aria-live="polite">
          <template v-if="isSeated">
            <p class="table-box__seated">{{ $t('checkout.table.seated', { number: tableNumber }) }}</p>
            <button type="button" class="table-box__change" @click="leaveTable">
              {{ $t('checkout.table.change') }}
            </button>
          </template>
          <template v-else>
            <p>{{ $t('checkout.table.needed') }}</p>
            <BaseInput
              v-model="codeInput"
              name="table_code"
              autocomplete="off"
              :label="$t('checkout.table.codeLabel')"
              :hint="$t('checkout.table.codeHint')"
              :error="errors.table"
            />
            <BaseButton variant="secondary" size="sm" :loading="resolving" @click="useCode">
              {{ $t('checkout.table.use') }}
            </BaseButton>
          </template>
          <p v-if="isSeated && errors.table" class="field__error">{{ errors.table }}</p>
        </section>

        <BaseInput
          v-if="orderType === 'delivery'"
          v-model="address"
          name="delivery_address"
          autocomplete="street-address"
          :label="$t('checkout.address')"
          :error="errors.address"
          :maxlength="500"
          required
        />
        <BaseInput
          v-if="orderType !== 'dine_in'"
          v-model="phone"
          type="tel"
          name="contact_phone"
          autocomplete="tel"
          inputmode="tel"
          :label="$t('checkout.phone')"
          :hint="orderType === 'takeaway' ? $t('checkout.phoneHint') : ''"
          :error="errors.phone"
          :required="orderType === 'delivery'"
          :show-optional="orderType === 'takeaway'"
        />
        <BaseInput
          v-model="notes"
          name="notes"
          :label="$t('checkout.notes')"
          :hint="$t('checkout.notesHint')"
          :error="errors.notes"
          :maxlength="500"
          show-optional
        />

        <BaseButton type="submit" size="lg" block :loading="submitting">{{ $t('checkout.submit') }}</BaseButton>
        <BaseButton variant="ghost" size="sm" :to="{ name: 'cart' }">{{ $t('checkout.backToCart') }}</BaseButton>
      </form>

      <aside class="summary" aria-labelledby="order-title">
        <h2 id="order-title" class="summary__title">{{ $t('checkout.yourOrder') }}</h2>

        <section v-if="hasProblems" class="problems" role="alert">
          <p class="problems__title">{{ $t('checkout.problemsTitle') }}</p>
          <BaseButton variant="secondary" size="sm" @click="removeProblems">
            {{ $t('checkout.removeProblems') }}
          </BaseButton>
        </section>

        <ul class="summary__lines">
          <li v-for="line in lines" :key="line.id" class="summary__line">
            <span>{{ line.quantity }} × {{ line.name }}</span>
            <span>{{ money(lineTotal(line)) }}</span>
            <p v-if="problems[line.id]" class="summary__problem">{{ problems[line.id] }}</p>
          </li>
        </ul>

        <dl class="summary__rows">
          <div>
            <dt>{{ $t('cart.subtotal') }}</dt>
            <dd>{{ money(subtotal) }}</dd>
          </div>
          <div v-if="showTax">
            <dt>{{ $t('cart.tax', { rate: taxPercent }) }}</dt>
            <dd>{{ money(taxAmount) }}</dd>
          </div>
          <div class="summary__total">
            <dt>{{ $t('cart.total') }}</dt>
            <dd>{{ money(estimatedTotal) }}</dd>
          </div>
        </dl>
        <p class="summary__note muted">{{ $t('cart.estimateNote') }}</p>
      </aside>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import cartMoney from '@/mixins/cartMoney'
import formErrors from '@/mixins/formErrors'
import { orderService } from '@/services/orderService'
import { useCartStore } from '@/store/cart'
import { useTableStore } from '@/store/table'
import { useToastStore } from '@/store/toasts'
import { toApiError } from '@/utils/errors'
import { isBlank } from '@/utils/validation'
import { extractTableToken } from '@/utils/tableCode'

const TYPES = ['dine_in', 'takeaway', 'delivery']

export default {
  name: 'CheckoutView',
  components: { BaseButton, BaseInput, EmptyState, FormAlert },
  mixins: [formErrors, cartMoney],
  data() {
    return {
      types: TYPES,
      orderType: useTableStore().isSeated ? 'dine_in' : 'takeaway',
      address: '',
      phone: '',
      notes: '',
      codeInput: '',
      resolving: false,
      problems: {}, // cart line id -> why the server refused that dish
    }
  },
  computed: {
    ...mapState(useCartStore, ['lines', 'isEmpty', 'lineTotal']),
    ...mapState(useTableStore, { isSeated: 'isSeated', tableNumber: 'number', tableToken: 'token' }),
    hasProblems() {
      return Object.keys(this.problems).length > 0
    },
  },
  methods: {
    ...mapActions(useCartStore, ['remove', 'clear']),
    ...mapActions(useTableStore, { scanTable: 'scan', leaveTable: 'clear' }),
    ...mapActions(useToastStore, ['success']),

    async useCode() {
      this.errors = {}
      const token = extractTableToken(this.codeInput)
      if (!token) {
        this.errors = { table: this.$t('checkout.table.invalid') }
        return
      }
      this.resolving = true
      try {
        await this.scanTable(token)
        this.codeInput = ''
      } catch {
        this.errors = { table: this.$t('checkout.table.invalid') }
      } finally {
        this.resolving = false
      }
    },

    validate() {
      const errors = {}
      const required = this.$t('auth.validation.required')
      if (this.orderType === 'dine_in' && !this.isSeated) errors.table = this.$t('checkout.table.needed')
      if (this.orderType === 'delivery') {
        if (isBlank(this.address)) errors.address = required
        if (isBlank(this.phone)) errors.phone = required
      }
      this.errors = errors
      return Object.keys(errors).length === 0
    },

    payload() {
      const body = { order_type: this.orderType, items: this.lines.length ? useCartStore().orderItems : [] }
      if (this.notes.trim()) body.notes = this.notes.trim()
      if (this.orderType === 'dine_in') body.table_token = this.tableToken
      if (this.orderType === 'delivery') body.delivery_address = this.address.trim()
      if (this.orderType !== 'dine_in' && this.phone.trim()) body.contact_phone = this.phone.trim()
      return body
    },

    async submit() {
      if (this.submitting) return // A second click or Enter must never create a second order.
      this.clearErrors()
      this.problems = {}
      if (!this.validate()) return

      this.submitting = true
      try {
        const order = await orderService.create(this.payload())
        this.clear()
        this.success(this.$t('checkout.placed', { id: order.id }))
        await this.$router.replace({ name: 'order', params: { id: order.id } })
      } catch (error) {
        this.fail(error)
      } finally {
        this.submitting = false
      }
    },

    /** Put each server complaint next to what it is about. */
    fail(error) {
      const apiError = toApiError(error)
      this.showApiError(apiError)
      const sent = this.errors
      this.errors = {
        table: sent.table_token || sent.table,
        address: sent.delivery_address,
        phone: sent.contact_phone,
        notes: sent.notes,
        type: sent.order_type,
      }

      if (sent.table_token) {
        this.leaveTable() // The code is no longer good: forget it so the diner scans again.
        this.errors.table = this.$t('checkout.table.invalid')
      }

      // The server answers per line, in the order the lines were sent.
      const perLine = Array.isArray(apiError.errors?.items) ? apiError.errors.items : []
      const problems = {}
      perLine.forEach((lineErrors, index) => {
        const message = lineErrors?.menu_item?.[0]
        if (message && this.lines[index]) problems[this.lines[index].id] = message
      })
      this.problems = problems
    },

    removeProblems() {
      for (const id of Object.keys(this.problems)) this.remove(Number(id))
      this.problems = {}
    },
  },
}
</script>

<style scoped>
.checkout {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-7) var(--space-6);
}

.checkout__layout {
  display: grid;
  gap: var(--space-6);
}

.types {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  padding: 0;
  border: 0;
}

.types__legend {
  margin-bottom: var(--space-2);
  font-weight: 600;
}

.type {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
}

.type--active {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.type input {
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.15rem;
  accent-color: var(--color-primary);
}

.type__text {
  display: flex;
  flex-direction: column;
  font-size: var(--text-sm);
}

.table-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface-sunken);
  border-radius: var(--radius-sm);
}

.table-box__seated {
  font-weight: 700;
}

.table-box__change {
  min-height: var(--target-size);
  padding: 0;
  color: var(--color-accent-text);
  text-decoration: underline;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.field__error {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-danger);
}

.summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-self: start;
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.summary__title {
  font-size: var(--text-xl);
}

.summary__lines {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0;
  list-style: none;
}

.summary__line {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-3);
}

.summary__problem {
  flex-basis: 100%;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-danger);
}

.problems {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-danger-surface);
  border-inline-start: 4px solid var(--color-danger);
  border-radius: var(--radius-sm);
}

.problems__title {
  font-weight: 600;
  color: var(--color-danger);
}

.summary__rows {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.summary__rows div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.summary__rows dd {
  margin: 0;
}

.summary__total {
  font-size: var(--text-lg);
  font-weight: 700;
}

.summary__note {
  font-size: var(--text-xs);
}

@media (min-width: 56em) {
  .checkout__layout {
    grid-template-columns: 1fr 24rem;
    align-items: start;
  }

  .summary {
    position: sticky;
    top: calc(var(--header-height) + var(--space-4));
  }
}
</style>
