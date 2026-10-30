<template>
  <div class="shell">
    <a class="skip-link" href="#main">{{ $t('layout.skipToContent') }}</a>
    <AppHeader />
    <main id="main" class="shell__main" tabindex="-1">
      <router-view v-slot="{ Component, route }">
        <transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>
    <AppFooter />
  </div>
</template>

<script>
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

export default {
  name: 'MainLayout',
  components: { AppFooter, AppHeader },
}
</script>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.shell__main {
  flex: 1;
  outline: none; /* Focus is moved here after a navigation, not for the user to see. */
}

.skip-link {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  z-index: calc(var(--z-header) + 1);
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
