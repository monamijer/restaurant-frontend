<template>
  <section class="hero" :aria-roledescription="$t('home.hero.role')" :aria-label="$t('home.hero.label')">
    <div class="hero__slides">
      <article
        v-for="(slide, index) in slides"
        :key="slide.key"
        class="hero__slide"
        :class="{ 'is-active': index === active }"
        :aria-hidden="index === active ? 'false' : 'true'"
        :aria-roledescription="$t('home.hero.slideRole')"
        :aria-label="$t('home.hero.slideOf', { index: index + 1, total: slides.length })"
      >
        <p class="hero__eyebrow eyebrow">{{ $t(slide.eyebrowKey) }}</p>
        <h1 class="hero__title">{{ $t(slide.titleKey) }}</h1>
        <p class="hero__lead">{{ $t(slide.leadKey) }}</p>
        <div class="cluster">
          <BaseButton size="lg" :to="slide.ctaRoute">{{ $t(slide.ctaKey) }}</BaseButton>
          <BaseButton size="lg" variant="ghost" :to="{ name: 'menu' }">{{ $t('menu.viewMenu') }}</BaseButton>
        </div>
      </article>
    </div>

    <div class="hero__controls" role="group" :aria-label="$t('home.hero.controls')">
      <button type="button" class="hero__arrow" :aria-label="$t('home.hero.previous')" @click="prev">
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        v-for="(slide, index) in slides"
        :key="slide.key"
        type="button"
        class="hero__dot"
        :class="{ 'is-active': index === active }"
        :aria-label="$t('home.hero.goTo', { index: index + 1 })"
        :aria-current="index === active ? 'true' : 'false'"
        @click="goTo(index)"
      />
      <button type="button" class="hero__arrow" :aria-label="$t('home.hero.next')" @click="next">
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M7.5 4l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </section>
</template>

<script>
import BaseButton from '@/components/common/BaseButton.vue'

export default {
  name: 'HeroCarousel',
  components: { BaseButton },
  data() {
    return {
      active: 0,
      slides: [
        {
          key: 'book',
          eyebrowKey: 'home.hero.slides.book.eyebrow',
          titleKey: 'home.hero.slides.book.title',
          leadKey: 'home.hero.slides.book.lead',
          ctaKey: 'home.hero.slides.book.cta',
          ctaRoute: { name: 'reservations' },
        },
        {
          key: 'order',
          eyebrowKey: 'home.hero.slides.order.eyebrow',
          titleKey: 'home.hero.slides.order.title',
          leadKey: 'home.hero.slides.order.lead',
          ctaKey: 'home.hero.slides.order.cta',
          ctaRoute: { name: 'menu' },
        },
        {
          key: 'queue',
          eyebrowKey: 'home.hero.slides.queue.eyebrow',
          titleKey: 'home.hero.slides.queue.title',
          leadKey: 'home.hero.slides.queue.lead',
          ctaKey: 'home.hero.slides.queue.cta',
          ctaRoute: { name: 'queue' },
        },
      ],
    }
  },
  methods: {
    goTo(index) {
      this.active = (index + this.slides.length) % this.slides.length
    },
    prev() { this.goTo(this.active - 1) },
    next() { this.goTo(this.active + 1) },
  },
}
</script>

<style scoped>
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding-block: var(--space-9) var(--space-8);
}

.hero__slides {
  position: relative;
  min-height: 18rem;
}

.hero__slide {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: flex-start;
  opacity: 0;
  transform: translateY(0.5rem);
  transition:
    opacity var(--duration-slow) var(--ease-out),
    transform var(--duration-slow) var(--ease-out);
  pointer-events: none;
  position: absolute;
  inset: 0;
}

.hero__slide.is-active {
  opacity: 1;
  transform: none;
  pointer-events: auto;
  position: relative;
}

.hero__eyebrow {
  margin-bottom: var(--space-2);
}

.hero__title {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.05;
  max-width: 20ch;
  text-wrap: balance;
}

.hero__lead {
  max-width: 36rem;
  font-size: var(--text-lg);
  color: var(--color-text-muted);
  text-wrap: pretty;
}

.hero__controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.hero__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--target-size);
  height: var(--target-size);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.hero__arrow:hover {
  background: var(--color-surface-sunken);
}

.hero__dot {
  width: 0.6rem;
  height: 0.6rem;
  padding: 0;
  background: var(--color-border-strong);
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out);
}

.hero__dot.is-active {
  background: var(--color-accent);
  transform: scale(1.25);
}

@media (min-width: 64em) {
  .hero {
    padding-block: var(--space-10) var(--space-9);
  }
}
</style>
