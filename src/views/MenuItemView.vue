<template>
  <div class="dish-page container">
    <router-link class="dish-page__back" :to="{ name: 'menu' }">
      <span aria-hidden="true">←</span> {{ $t('menu.item.back') }}
    </router-link>

    <div v-if="loading" class="dish-page__layout" aria-hidden="true">
      <BaseSkeleton height="18rem" />
      <div class="stack">
        <BaseSkeleton width="60%" height="2rem" />
        <BaseSkeleton />
        <BaseSkeleton width="80%" />
      </div>
    </div>

    <EmptyState
      v-else-if="notFound"
      :title="$t('menu.item.notFoundTitle')"
      :description="$t('menu.item.notFoundText')"
    >
      <BaseButton :to="{ name: 'menu' }">{{ $t('menu.item.back') }}</BaseButton>
    </EmptyState>

    <EmptyState v-else-if="failed" :title="$t('menu.item.errorTitle')" :description="$t('menu.errorText')">
      <BaseButton variant="secondary" @click="load">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <article v-else class="dish-page__layout">
      <div class="dish-page__media">
        <img v-if="item.image" class="dish-page__image" :src="item.image" :alt="item.name" width="800" height="600" />
        <div v-else class="dish-page__placeholder" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="64" height="64">
            <path
              d="M7 3v8a2 2 0 0 0 2 2v8h2v-8a2 2 0 0 0 2-2V3h-1.5v6h-1V3h-1.5v6h-1V3zM17 3c-2 1-3 4-3 7 0 1.7.8 2.8 2 3.3V21h2V3z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      <div class="dish-page__details">
        <div class="cluster">
          <BaseBadge v-if="item.is_featured" tone="info">{{ $t('menu.featured') }}</BaseBadge>
          <BaseBadge v-if="!item.is_available" tone="danger">{{ $t('menu.unavailable') }}</BaseBadge>
        </div>

        <h1>{{ item.name }}</h1>
        <p class="dish-page__price">{{ price }}</p>
        <p class="dish-page__description">{{ item.description }}</p>

        <div class="dish-page__buy">
          <AddToCartButton :item="item" size="lg" />
        </div>

        <dl class="dish-page__facts">
          <div>
            <dt>{{ $t('menu.item.category') }}</dt>
            <dd>{{ item.category_name }}</dd>
          </div>
          <div>
            <dt>{{ $t('menu.item.preparation') }}</dt>
            <dd>{{ $t('menu.item.preparationValue', { minutes: item.preparation_time }) }}</dd>
          </div>
          <div v-if="hasCalories">
            <dt>{{ $t('menu.item.calories') }}</dt>
            <dd>{{ $t('menu.item.caloriesValue', { count: item.calories }) }}</dd>
          </div>
          <div>
            <dt>{{ $t('menu.item.allergens') }}</dt>
            <dd>
              <span v-if="item.allergens.length === 0">{{ $t('menu.item.noAllergens') }}</span>
              <span v-else class="cluster">
                <BaseBadge v-for="allergen in item.allergens" :key="allergen" tone="warning">{{ allergen }}</BaseBadge>
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </article>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import AddToCartButton from '@/components/cart/AddToCartButton.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { CURRENCY } from '@/config'
import { menuService } from '@/services/menuService'
import { useUiStore } from '@/store/ui'
import { toApiError } from '@/utils/errors'
import { formatMoney } from '@/utils/format'

export default {
  name: 'MenuItemView',
  components: { AddToCartButton, BaseBadge, BaseButton, BaseSkeleton, EmptyState },
  data() {
    return { item: null, loading: true, notFound: false, failed: false }
  },
  computed: {
    ...mapState(useUiStore, ['locale']),
    price() {
      return formatMoney(this.item.price, CURRENCY, this.locale)
    },
    hasCalories() {
      return Number.isFinite(this.item.calories)
    },
  },
  created() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      this.notFound = false
      this.failed = false
      try {
        this.item = await menuService.item(this.$route.params.id)
      } catch (error) {
        if (toApiError(error).status === 404) this.notFound = true
        else this.failed = true
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.dish-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-6) var(--space-7);
}

.dish-page__back {
  align-self: flex-start;
  font-weight: 600;
}

.dish-page__layout {
  display: grid;
  gap: var(--space-6);
}

.dish-page__media {
  overflow: hidden;
  background: var(--color-surface-sunken);
  border-radius: var(--radius-md);
}

.dish-page__image {
  width: 100%;
  height: auto;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.dish-page__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4 / 3;
  color: var(--color-text-muted);
}

.dish-page__details {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.dish-page__price {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 600;
}

.dish-page__description {
  max-width: 40rem;
}

.dish-page__buy {
  max-width: 20rem;
}

.dish-page__facts {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.dish-page__facts div {
  display: grid;
  gap: var(--space-1);
}

.dish-page__facts dt {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.dish-page__facts dd {
  margin: 0;
}

@media (min-width: 48em) {
  .dish-page__layout {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}
</style>
