import { mapState } from 'pinia'
import { CURRENCY } from '@/config'
import { useCartStore } from '@/store/cart'
import { useRestaurantStore } from '@/store/restaurant'
import { useUiStore } from '@/store/ui'
import { formatMoney } from '@/utils/format'
import { centsToAmount, estimateTaxCents } from '@/utils/money'

/**
 * The estimated tax and total of the cart, shared by the cart and the checkout. These are
 * display estimates; the backend computes the real amounts when the order is created.
 */
export default {
  computed: {
    ...mapState(useCartStore, ['subtotal', 'subtotalCents']),
    ...mapState(useRestaurantStore, ['taxRate']),
    ...mapState(useUiStore, ['locale']),

    showTax() {
      return this.taxRate !== null && Number(this.taxRate) > 0
    },
    taxCents() {
      return this.showTax ? estimateTaxCents(this.subtotalCents, this.taxRate) : 0
    },
    taxAmount() {
      return centsToAmount(this.taxCents)
    },
    taxPercent() {
      return String(Number(this.taxRate)) // "10.00" is shown as "10"
    },
    estimatedTotal() {
      return centsToAmount(this.subtotalCents + this.taxCents)
    },
  },

  methods: {
    money(amount) {
      return formatMoney(amount, CURRENCY, this.locale)
    },
  },
}
