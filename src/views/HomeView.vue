<template>
  <div class="home">
    <div class="container">
      <HeroCarousel v-reveal />
    </div>

    <section class="value" :aria-label="$t('home.value.label')">
      <ul class="container value__list">
        <li v-if="hasHours" class="value__item">
          <span class="value__title">{{ $t('home.value.hours.title') }}</span>
          <span class="value__text">{{ $t('home.value.hours.text', { opens: opensAt, closes: closesAt }) }}</span>
        </li>
        <li v-for="item in valueItems" :key="item" class="value__item">
          <span class="value__title">{{ $t(`home.value.${item}.title`) }}</span>
          <span class="value__text">{{ $t(`home.value.${item}.text`) }}</span>
        </li>
      </ul>
    </section>

    <section v-reveal class="section">
      <div class="container">
        <p class="eyebrow">{{ $t('home.features.eyebrow') }}</p>
        <h2 class="section__title">{{ $t('home.features.title') }}</h2>
        <p class="section__lead">{{ $t('home.features.lead') }}</p>

        <ul class="features">
          <li v-for="feature in features" :key="feature.key" class="feature">
            <span class="feature__icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path :d="feature.icon" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <h3 class="feature__title">{{ $t(`home.features.${feature.key}.title`) }}</h3>
            <p class="feature__lead">{{ $t(`home.features.${feature.key}.lead`) }}</p>
            <RouterLink class="feature__link" :to="feature.route">
              {{ $t(`home.features.${feature.key}.cta`) }} →
            </RouterLink>
          </li>
        </ul>
      </div>
    </section>

    <section v-reveal class="section section--tinted">
      <div class="container">
        <p class="eyebrow">{{ $t('home.how.eyebrow') }}</p>
        <h2 class="section__title">{{ $t('home.how.title') }}</h2>
        <p class="section__lead">{{ $t('home.how.lead') }}</p>

        <ol class="steps">
          <li v-for="step in steps" :key="step.key" class="step">
            <span class="step__number" aria-hidden="true">{{ step.number }}</span>
            <h3 class="step__title">{{ $t(`home.how.steps.${step.key}.title`) }}</h3>
            <p class="step__lead">{{ $t(`home.how.steps.${step.key}.lead`) }}</p>
            <RouterLink class="step__link" :to="step.route">
              {{ $t(`home.how.steps.${step.key}.cta`) }} →
            </RouterLink>
          </li>
        </ol>
      </div>
    </section>

    <section v-if="shownCategories.length" v-reveal class="section">
      <div class="container">
        <p class="eyebrow">{{ $t('home.categories.eyebrow') }}</p>
        <h2 class="section__title">{{ $t('home.categories.title') }}</h2>
        <p class="section__lead">{{ $t('home.categories.lead') }}</p>

        <ul class="chips">
          <li v-for="category in shownCategories" :key="category.id">
            <RouterLink class="chip" :to="{ name: 'menu', query: { category: category.slug } }">
              {{ category.name }}
            </RouterLink>
          </li>
          <li>
            <RouterLink class="chip chip--all" :to="{ name: 'menu' }">{{ $t('home.categories.all') }} →</RouterLink>
          </li>
        </ul>
      </div>
    </section>

    <section v-reveal class="section">
      <div class="container">
        <div class="cta-block">
          <div>
            <h2 class="section__title">{{ isAuthenticated ? $t('home.cta.title') : $t('home.cta.guestTitle') }}</h2>
            <p class="section__lead">{{ isAuthenticated ? $t('home.cta.lead') : $t('home.cta.guestLead') }}</p>
          </div>
          <div class="cluster">
            <template v-if="isAuthenticated">
              <BaseButton size="lg" :to="{ name: 'menu' }">{{ $t('menu.viewMenu') }}</BaseButton>
              <BaseButton size="lg" variant="ghost" :to="{ name: 'reservations' }">{{ $t('home.cta.reserve') }}</BaseButton>
            </template>
            <template v-else>
              <BaseButton size="lg" :to="{ name: 'register' }">{{ $t('home.cta.register') }}</BaseButton>
              <BaseButton size="lg" variant="ghost" :to="{ name: 'menu' }">{{ $t('menu.viewMenu') }}</BaseButton>
            </template>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import BaseButton from '@/components/common/BaseButton.vue'
import HeroCarousel from '@/components/home/HeroCarousel.vue'
import { useAuthStore } from '@/store/auth'
import { useMenuStore } from '@/store/menu'
import { useRestaurantStore } from '@/store/restaurant'

const MAX_CATEGORIES = 8

export default {
  name: 'HomeView',
  components: { BaseButton, HeroCarousel },
  data() {
    return {
      valueItems: ['payment', 'queue', 'languages'],
      features: [
        { key: 'book', route: { name: 'reservations' }, icon: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z' },
        { key: 'queue', route: { name: 'queue' }, icon: 'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.2a3.5 3.5 0 0 1 0 6.6' },
        { key: 'order', route: { name: 'menu' }, icon: 'M6 7h12l1 13H5L6 7zM9 7a3 3 0 0 1 6 0' },
        { key: 'track', route: { name: 'orders' }, icon: 'M3 12h4l3-8 4 16 3-8h4' },
      ],
      steps: [
        { key: 'choose', number: '1', route: { name: 'menu' } },
        { key: 'order', number: '2', route: { name: 'menu' } },
        { key: 'follow', number: '3', route: { name: 'orders' } },
      ],
    }
  },
  computed: {
    ...mapState(useAuthStore, ['isAuthenticated']),
    ...mapState(useMenuStore, ['categories']),
    ...mapState(useRestaurantStore, ['hasHours', 'opensAt', 'closesAt']),
    shownCategories() {
      return Array.isArray(this.categories) ? this.categories.slice(0, MAX_CATEGORIES) : []
    },
  },
  created() {
    this.loadCategories()
  },
  methods: {
    ...mapActions(useMenuStore, ['loadCategories']),
  },
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
}

/* Value strip: four short facts under the hero. */
.value {
  margin-top: var(--space-6);
  border-block: 1px solid var(--color-border);
  background: var(--color-surface-sunken);
}

.value__list {
  display: grid;
  gap: var(--space-4);
  padding-block: var(--space-5);
  margin-block: 0;
  list-style: none;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
}

.value__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.value__title {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-accent-text);
}

.value__text {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

/* Features */
.features {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  padding: 0;
  margin: var(--space-6) 0 0;
  list-style: none;
}

.feature {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-base) var(--ease-out), box-shadow var(--duration-base) var(--ease-out);
}

.feature:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.feature__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  margin-bottom: var(--space-2);
  color: var(--color-accent-text);
  background: var(--color-accent-surface);
  border-radius: var(--radius-md);
}

.feature__title {
  font-size: var(--text-lg);
}

.feature__lead {
  flex: 1;
  color: var(--color-text-muted);
}

.feature__link {
  margin-top: var(--space-2);
  font-weight: 600;
  color: var(--color-accent-text);
  text-decoration: none;
}

.feature__link:hover {
  text-decoration: underline;
}

/* How it works */
.steps {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  padding: 0;
  margin: var(--space-6) 0 0;
  list-style: none;
  counter-reset: step;
}

.step {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-base) var(--ease-out), box-shadow var(--duration-base) var(--ease-out);
}

.step:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.step__number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-accent-text);
  background: var(--color-accent-surface);
  border-radius: var(--radius-pill);
  margin-bottom: var(--space-2);
}

.step__title {
  font-size: var(--text-xl);
}

.step__lead {
  color: var(--color-text-muted);
}

.step__link {
  margin-top: var(--space-2);
  font-weight: 600;
  color: var(--color-accent-text);
  text-decoration: none;
}

.step__link:hover {
  text-decoration: underline;
}

/* Categories */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding: 0;
  margin: var(--space-5) 0 0;
  list-style: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  min-height: var(--target-size);
  padding-inline: var(--space-5);
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-pill);
  transition: background var(--duration-base) var(--ease-out), border-color var(--duration-base) var(--ease-out);
}

.chip:hover {
  background: var(--color-accent-surface);
  border-color: var(--color-accent);
}

.chip--all {
  color: var(--color-accent-text);
  border-style: dashed;
}

/* Closing call to action */
.cta-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  align-items: flex-start;
  padding: var(--space-7) var(--space-5);
  background: var(--color-accent-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

@media (min-width: 48rem) {
  .cta-block {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-inline: var(--space-7);
  }
}
</style>
