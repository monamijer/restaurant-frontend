<template>
  <div class="home">
    <div class="container">
      <HeroCarousel v-reveal />
    </div>

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

    <section v-reveal class="section">
      <div class="container cta-block">
        <div>
          <h2 class="section__title">{{ $t('home.cta.title') }}</h2>
          <p class="section__lead">{{ $t('home.cta.lead') }}</p>
        </div>
        <div class="cluster">
          <BaseButton size="lg" :to="{ name: 'menu' }">{{ $t('menu.viewMenu') }}</BaseButton>
          <BaseButton size="lg" variant="ghost" :to="{ name: 'reservations' }">{{ $t('home.cta.reserve') }}</BaseButton>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import BaseButton from '@/components/common/BaseButton.vue'
import HeroCarousel from '@/components/home/HeroCarousel.vue'

export default {
  name: 'HomeView',
  components: { BaseButton, HeroCarousel },
  data() {
    return {
      steps: [
        { key: 'choose', number: '1', route: { name: 'menu' } },
        { key: 'order', number: '2', route: { name: 'menu' } },
        { key: 'follow', number: '3', route: { name: 'orders' } },
      ],
    }
  },
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
}

.steps {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  padding: 0;
  margin: 0;
  margin-top: var(--space-6);
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

.cta-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  align-items: flex-start;
  padding-block: var(--space-8);
}
</style>
