<template>
  <article class="dish" :class="{ 'dish--unavailable': !item.is_available }">
    <div class="dish__media">
      <img
        v-if="item.image"
        class="dish__image"
        :src="item.image"
        alt=""
        width="800"
        height="600"
        loading="lazy"
      />
      <div v-else class="dish__placeholder" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path
            d="M7 3v8a2 2 0 0 0 2 2v8h2v-8a2 2 0 0 0 2-2V3h-1.5v6h-1V3h-1.5v6h-1V3zM17 3c-2 1-3 4-3 7 0 1.7.8 2.8 2 3.3V21h2V3z"
            fill="currentColor"
          />
        </svg>
      </div>
      <BaseBadge v-if="item.is_featured" class="dish__flag" tone="info">{{ $t('menu.featured') }}</BaseBadge>
    </div>

    <div class="dish__body">
      <p class="dish__category">{{ item.category_name }}</p>
      <h3 class="dish__name">
        <router-link class="dish__link" :to="{ name: 'menu-item', params: { id: item.id } }">
          {{ item.name }}
        </router-link>
      </h3>
      <p class="dish__description">{{ item.description }}</p>

      <div class="dish__footer">
        <span class="dish__price">{{ price }}</span>
        <BaseBadge v-if="!item.is_available" tone="danger">{{ $t('menu.unavailable') }}</BaseBadge>
        <span v-else class="dish__time">{{ $t('menu.prepTime', { minutes: item.preparation_time }) }}</span>
      </div>
    </div>
  </article>
</template>

<script>
import { mapState } from 'pinia'
import BaseBadge from '@/components/common/BaseBadge.vue'
import { CURRENCY } from '@/config'
import { useUiStore } from '@/store/ui'
import { formatMoney } from '@/utils/format'

export default {
  name: 'MenuItemCard',
  components: { BaseBadge },
  props: {
    item: { type: Object, required: true },
  },
  computed: {
    ...mapState(useUiStore, ['locale']),
    price() {
      return formatMoney(this.item.price, CURRENCY, this.locale)
    },
  },
}
</script>

<style scoped>
.dish {
  position: relative; /* The title link stretches over the whole card. */
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

@media (hover: hover) {
  .dish:hover {
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-md);
  }
}

.dish:focus-within {
  border-color: var(--color-accent);
}

.dish--unavailable .dish__media,
.dish--unavailable .dish__body > :not(.dish__footer) {
  opacity: 0.6;
}

.dish__media {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--color-surface-sunken);
}

.dish__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dish__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
}

.dish__flag {
  position: absolute;
  top: var(--space-3);
  inset-inline-start: var(--space-3);
}

.dish__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
}

.dish__category {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.dish__name {
  font-size: var(--text-lg);
}

.dish__link {
  color: inherit;
  text-decoration: none;
}

.dish__link::after {
  content: '';
  position: absolute;
  inset: 0;
}

.dish__link:focus-visible {
  outline: none; /* The card shows the focus ring instead. */
}

.dish:has(.dish__link:focus-visible) {
  outline: var(--focus-ring);
  outline-offset: 2px;
}

.dish__description {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.dish__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: auto;
  padding-top: var(--space-3);
}

.dish__price {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
}

.dish__time {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
</style>
