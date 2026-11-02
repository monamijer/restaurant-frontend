<template>
  <div class="add">
    <BaseButton v-if="quantity === 0" :size="size" block :disabled="!item.is_available" @click="addOne">
      {{ $t('cart.add') }}
    </BaseButton>
    <QuantityStepper
      v-else
      :model-value="quantity"
      :min="0"
      :label="item.name"
      @update:model-value="change"
    />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import BaseButton from '@/components/common/BaseButton.vue'
import QuantityStepper from '@/components/cart/QuantityStepper.vue'
import { MAX_LINE_QUANTITY } from '@/config'
import { useCartStore } from '@/store/cart'
import { useToastStore } from '@/store/toasts'

export default {
  name: 'AddToCartButton',
  components: { BaseButton, QuantityStepper },
  props: {
    item: { type: Object, required: true },
    size: { type: String, default: 'sm' },
  },
  computed: {
    ...mapState(useCartStore, ['quantityOf']),
    quantity() {
      return this.quantityOf(this.item.id)
    },
  },
  methods: {
    ...mapActions(useCartStore, ['add', 'setQuantity']),
    ...mapActions(useToastStore, ['info', 'error']),

    addOne() {
      const result = this.add(this.item)
      if (result === 'added') this.info(this.$t('cart.added', { name: this.item.name }))
      else if (result === 'limit') this.error(this.$t('cart.full'))
    },

    change(quantity) {
      if (quantity > this.quantity && this.add(this.item) === 'limit') {
        this.error(this.$t('cart.limit', { max: MAX_LINE_QUANTITY }))
        return
      }
      if (quantity < this.quantity) this.setQuantity(this.item.id, quantity)
    },
  },
}
</script>

<style scoped>
.add {
  position: relative;
  z-index: 1; /* Above the stretched dish link, so the button is clickable. */
}
</style>
