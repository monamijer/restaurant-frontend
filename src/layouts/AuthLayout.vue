<template>
  <div class="auth-shell">
    <a class="skip-link" href="#main">{{ $t('layout.skipToContent') }}</a>

    <header class="auth-shell__bar container">
      <router-link class="auth-shell__brand" :to="{ name: 'home' }">{{ name }}</router-link>
      <div class="cluster">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </header>

    <main id="main" class="auth-shell__main" tabindex="-1">
      <div class="auth-shell__card">
        <router-view v-slot="{ Component, route }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import { useRestaurantStore } from '@/store/restaurant'

export default {
  name: 'AuthLayout',
  components: { LocaleSwitcher, ThemeToggle },
  computed: {
    ...mapState(useRestaurantStore, ['name']),
  },
}
</script>

<style scoped>
.auth-shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.auth-shell__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--header-height);
  padding-top: env(safe-area-inset-top);
}

.auth-shell__brand {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
}

.auth-shell__main {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--space-5) var(--space-4) var(--space-8);
  outline: none;
}

.auth-shell__card {
  width: 100%;
  max-width: var(--container-narrow);
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

@media (min-width: 40em) {
  .auth-shell__main {
    align-items: center;
  }

  .auth-shell__card {
    padding: var(--space-6);
  }
}

.skip-link {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  padding: var(--space-3) var(--space-4);
  font-weight: 600;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: var(--radius-sm);
  transform: translateY(-200%);
}

.skip-link:focus {
  transform: none;
}
</style>
