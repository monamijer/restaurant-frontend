<template>
  <div class="home container">
    <section class="home__hero" aria-labelledby="home-title">
      <p class="eyebrow">{{ $t('home.eyebrow') }}</p>
      <h1 id="home-title">{{ $t('home.heading', { name }) }}</h1>
      <p class="home__lead muted">{{ $t('home.lead') }}</p>

      <div class="cluster">
        <BaseButton v-if="isAuthenticated" size="lg" :to="{ name: homeRoute }">
          {{ $t('home.ctaSpace') }}
        </BaseButton>
        <template v-else>
          <BaseButton size="lg" :to="{ name: 'login' }">{{ $t('home.ctaLogin') }}</BaseButton>
          <BaseButton size="lg" variant="secondary" :to="{ name: 'register' }">
            {{ $t('home.ctaRegister') }}
          </BaseButton>
        </template>
        <BaseButton size="lg" variant="ghost" :to="{ name: 'menu' }">{{ $t('menu.viewMenu') }}</BaseButton>
      </div>
    </section>

    <section class="home__hours" aria-labelledby="hours-title">
      <h2 id="hours-title" class="home__hours-title">{{ $t('home.hoursTitle') }}</h2>

      <div v-if="loading" class="stack">
        <BaseSkeleton width="14rem" height="1.25rem" />
      </div>

      <template v-else-if="failed">
        <p>{{ $t('home.serverDown') }}</p>
        <p class="muted">{{ $t('home.serverDownHint') }}</p>
        <div>
          <BaseButton variant="secondary" size="sm" @click="load">{{ $t('common.retry') }}</BaseButton>
        </div>
      </template>

      <p v-else-if="hasHours" class="home__hours-value">
        {{ $t('footer.hoursValue', { open: opensAt, close: closesAt }) }}
      </p>
    </section>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import { useAuthStore } from '@/store/auth'
import { useRestaurantStore } from '@/store/restaurant'
import { homeRouteFor } from '@/utils/roles'

export default {
  name: 'HomeView',
  components: { BaseButton, BaseSkeleton },
  computed: {
    ...mapState(useAuthStore, ['isAuthenticated', 'role']),
    ...mapState(useRestaurantStore, ['name', 'opensAt', 'closesAt', 'hasHours', 'loading', 'failed']),
    homeRoute() {
      return homeRouteFor(this.role)
    },
  },
  methods: {
    ...mapActions(useRestaurantStore, ['load']),
  },
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  padding-block: var(--space-7) var(--space-6);
}

.home__hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
  padding-block: var(--space-6);
  border-block-end: 3px solid var(--color-accent);
}

.home__lead {
  max-width: 36rem;
  font-size: var(--text-lg);
}

.home__hours {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.home__hours-title {
  font-size: var(--text-xl);
}

.home__hours-value {
  font-size: var(--text-lg);
}
</style>
