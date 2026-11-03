<template>
  <div class="cart container">
    <header class="cart__header">
      <p class="eyebrow">{{ $t('cart.eyebrow') }}</p>
      <h1>{{ $t('cart.heading') }}</h1>
    </header>

    <EmptyState v-if="isEmpty" :title="$t('cart.emptyTitle')" :description="$t('cart.emptyText')">
      <BaseButton :to="{ name: 'menu' }">{{ $t('cart.emptyAction') }}</BaseButton>
    </EmptyState>

    <div v-else class="cart__layout">
      <ul class="cart__lines">
        <li v-for="line in lines" :key="line.id" class="line">
          <img v-if="line.image" class="line__image" :src="line.image" alt="" width="96" height="72" loading="lazy" />
          <div v-else class="line__image line__image--empty" aria-hidden="true" />

          <div class="line__main">
            <h2 class="line__name">
              <router-link :to="{ name: 'menu-item', params: { id: line.id } }">{{ line.name }}</router-link>
            </h2>
            <p class="line__price muted">{{ $t('cart.unitPrice', { price: money(toAmount(line.price)) }) }}</p>

            <label class="line__note-label" :for="`note-${line.id}`">{{ $t('cart.instructions') }}</label>
            <input
              :id="`note-${line.id}`"
              class="line__note"
              type="text"
              :value="line.note"
              :maxlength="maxNote"
              :placeholder="$t('cart.instructionsHint')"
              @input="setNote(line.id, $event.target.value)"
            />

            <div class="line__controls">
              <QuantityStepper
                :model-value="line.quantity"
                :label="line.name"
                @update:model-value="setQuantity(line.id, $event)"
              />
              <BaseButton
                variant="ghost"
                size="sm"
                :aria-label="$t('cart.removeLabel', { name: line.name })"
                @click="removeLine(line)"
              >
                {{ $t('cart.remove') }}
              </BaseButton>
            </div>
          </div>

          <p class="line__total">{{ money(lineTotal(line)) }}</p>
        </li>
      </ul>

      <aside class="summary" aria-labelledby="summary-title">
        <h2 id="summary-title" class="summary__title">{{ $t('cart.summary') }}</h2>
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

        <BaseButton block size="lg" :to="{ name: 'checkout' }">{{ $t('cart.order') }}</BaseButton>
        <BaseButton block variant="secondary" :to="{ name: 'menu' }">{{ $t('cart.continue') }}</BaseButton>
        <BaseButton block variant="ghost" size="sm" @click="confirmOpen = true">{{ $t('cart.clear') }}</BaseButton>
      </aside>
    </div>

    <ConfirmDialog
      :open="confirmOpen"
      danger
      :title="$t('cart.clearTitle')"
      :message="$t('cart.clearMessage')"
      :confirm-label="$t('cart.clearConfirm')"
      :cancel-label="$t('cart.clearKeep')"
      @cancel="confirmOpen = false"
      @confirm="emptyCart"
    />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import QuantityStepper from '@/components/cart/QuantityStepper.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { MAX_NOTE_LENGTH } from '@/config'
import cartMoney from '@/mixins/cartMoney'
import { useCartStore } from '@/store/cart'
import { useToastStore } from '@/store/toasts'
import { centsToAmount, toCents } from '@/utils/money'

export default {
  name: 'CartView',
  components: { BaseButton, ConfirmDialog, EmptyState, QuantityStepper },
  mixins: [cartMoney],
  data() {
    return { confirmOpen: false, maxNote: MAX_NOTE_LENGTH }
  },
  computed: {
    ...mapState(useCartStore, ['lines', 'isEmpty', 'lineTotal']),
  },
  methods: {
    ...mapActions(useCartStore, ['setQuantity', 'setNote', 'remove', 'clear']),
    ...mapActions(useToastStore, ['info']),

    toAmount(price) {
      return centsToAmount(toCents(price))
    },

    removeLine(line) {
      this.remove(line.id)
      this.info(this.$t('cart.removed', { name: line.name }))
    },

    emptyCart() {
      this.confirmOpen = false
      this.clear()
      this.info(this.$t('cart.cleared'))
    },
  },
}
</script>

<style scoped>
.cart {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-7) var(--space-6);
}

.cart__layout {
  display: grid;
  gap: var(--space-6);
}

.cart__lines {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0;
  list-style: none;
}

.line {
  display: grid;
  grid-template-columns: 5rem 1fr auto;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.line__image {
  width: 100%;
  height: auto;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: var(--color-surface-sunken);
  border-radius: var(--radius-sm);
}

.line__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.line__name {
  font-size: var(--text-lg);
}

.line__name a {
  color: inherit;
  text-decoration: none;
}

.line__price {
  font-size: var(--text-sm);
}

.line__note-label {
  margin-top: var(--space-2);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.line__note {
  min-height: var(--target-size);
  padding: 0 var(--space-3);
  font-size: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
}

.line__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.line__total {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  white-space: nowrap;
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

.summary__rows {
  display: grid;
  gap: var(--space-2);
  margin: 0;
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
  padding-top: var(--space-3);
  font-size: var(--text-lg);
  font-weight: 700;
  border-top: 1px solid var(--color-border);
}

.summary__note {
  font-size: var(--text-xs);
}

@media (min-width: 56em) {
  .cart__layout {
    grid-template-columns: 1fr 22rem;
    align-items: start;
  }

  .summary {
    position: sticky;
    top: calc(var(--header-height) + var(--space-4));
  }
}
</style>
