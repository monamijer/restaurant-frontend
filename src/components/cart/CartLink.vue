<template>
  <router-link class="cart-link" :to="{ name: 'cart' }" :aria-label="$t('cart.linkLabel', { count }, count)">
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM3 2v2h2l3.6 7.6-1.3 2.4A2 2 0 0 0 9 17h11v-2H9.4l1.1-2h7.5a2 2 0 0 0 1.7-1l3.6-6.5A1 1 0 0 0 22.4 4H6.2l-.9-2z"
        fill="currentColor"
      />
    </svg>
    <span v-if="count > 0" class="cart-link__count" aria-hidden="true">{{ count }}</span>
  </router-link>
</template>

<script>
import { mapState } from 'pinia'
import { useCartStore } from '@/store/cart'

export default {
  name: 'CartLink',
  computed: {
    ...mapState(useCartStore, ['count']),
  },
}
</script>

<style scoped>
.cart-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--target-size);
  height: var(--target-size);
  color: var(--color-text);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
}

@media (hover: hover) {
  .cart-link:hover {
    background: var(--color-surface-sunken);
  }
}

.cart-link__count {
  position: absolute;
  top: -0.5rem;
  inset-inline-end: -0.5rem;
  min-width: 1.35rem;
  padding: 0 0.3rem;
  font-size: var(--text-xs);
  font-weight: 700;
  line-height: 1.35rem;
  text-align: center;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: var(--radius-pill);
}
</style>
