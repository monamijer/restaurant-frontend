<template>
  <header class="header">
    <div class="header__bar container">
      <router-link class="header__brand" :to="{ name: 'home' }">
        <svg class="header__mark" viewBox="0 0 64 64" width="32" height="32" aria-hidden="true">
          <rect width="64" height="64" rx="12" fill="currentColor" />
          <path
            d="M20 14v14a6 6 0 0 0 4 5.6V50h4V33.6A6 6 0 0 0 32 28V14h-3v11h-2V14h-3v11h-2V14zM44 14c-4 2-6 7-6 12 0 3 1 5 3 6v18h4V14z"
            fill="var(--color-accent)"
          />
        </svg>
        <span class="header__name">{{ name }}</span>
      </router-link>

      <button
        type="button"
        class="header__menu-button"
        aria-controls="site-menu"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-label="open ? $t('header.closeMenu') : $t('header.openMenu')"
        @click="open = !open"
      >
        <span class="header__bars" :class="{ 'header__bars--open': open }" aria-hidden="true" />
      </button>

      <div id="site-menu" class="header__panel" :class="{ 'header__panel--open': open }">
        <nav class="header__nav" :aria-label="$t('nav.label')">
          <router-link
            v-for="item in items"
            :key="item.name"
            class="header__link"
            :to="item.route"
          >
            {{ $t(item.labelKey) }}
          </router-link>
        </nav>

        <div class="header__actions">
          <NotificationBell v-if="isAuthenticated" />
          <CartLink />
          <LocaleSwitcher />
          <ThemeToggle />

          <template v-if="isAuthenticated">
            <span class="header__user">{{ $t('header.signedInAs', { name: fullName }) }}</span>
            <BaseButton variant="secondary" size="sm" @click="signOut">{{ $t('header.logout') }}</BaseButton>
          </template>
          <template v-else>
            <BaseButton variant="secondary" size="sm" :to="{ name: 'login' }">{{ $t('header.login') }}</BaseButton>
            <BaseButton size="sm" :to="{ name: 'register' }">{{ $t('header.register') }}</BaseButton>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import CartLink from '@/components/cart/CartLink.vue'
import NotificationBell from '@/components/layout/NotificationBell.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import { navItemsFor } from '@/config/navigation'
import { useAuthStore } from '@/store/auth'
import { useRestaurantStore } from '@/store/restaurant'
import { useToastStore } from '@/store/toasts'

export default {
  name: 'AppHeader',
  components: { BaseButton, CartLink, LocaleSwitcher, NotificationBell, ThemeToggle },
  data() {
    return { open: false }
  },
  computed: {
    ...mapState(useAuthStore, ['isAuthenticated', 'role', 'fullName']),
    ...mapState(useRestaurantStore, ['name']),
    items() {
      return navItemsFor(this.role)
    },
  },
  watch: {
    // Moving to another page closes the mobile menu.
    '$route.fullPath'() {
      this.open = false
    },
  },
  methods: {
    ...mapActions(useAuthStore, ['logout']),
    ...mapActions(useToastStore, ['info']),
    async signOut() {
      await this.logout()
      this.info(this.$t('auth.loggedOut'))
      this.open = false
      this.$router.push({ name: 'home' })
    },
  },
}
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  padding-top: env(safe-area-inset-top);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  min-height: var(--header-height);
}

.header__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-primary);
  text-decoration: none;
}

.header__name {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
}

.header__menu-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--target-size);
  height: var(--target-size);
  background: transparent;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.header__bars,
.header__bars::before,
.header__bars::after {
  display: block;
  width: 1.25rem;
  height: 2px;
  background: currentColor;
  transition:
    transform var(--duration-base) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.header__bars {
  position: relative;
}

.header__bars::before,
.header__bars::after {
  content: '';
  position: absolute;
  left: 0;
}

.header__bars::before {
  top: -6px;
}

.header__bars::after {
  top: 6px;
}

.header__bars--open {
  background: transparent;
}

.header__bars--open::before {
  transform: translateY(6px) rotate(45deg);
}

.header__bars--open::after {
  transform: translateY(-6px) rotate(-45deg);
}

/* Mobile: the panel drops below the bar and fills the width. */
.header__panel {
  display: none;
  flex-basis: 100%;
  flex-direction: column;
  gap: var(--space-4);
  padding-block: var(--space-4) var(--space-5);
}

.header__panel--open {
  display: flex;
}

.header__nav {
  display: flex;
  flex-direction: column;
}

.header__link {
  display: flex;
  align-items: center;
  min-height: var(--target-size);
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
  border-bottom: 1px solid var(--color-border);
}

.header__link.router-link-exact-active {
  color: var(--color-accent-text);
}

.header__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.header__user {
  flex-basis: 100%;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

@media (min-width: 72em) {
  .header__menu-button {
    display: none;
  }

  .header__panel {
    display: flex;
    flex: 1;
    flex-basis: auto;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-5);
    padding-block: 0;
    margin-inline-start: var(--space-6);
  }

  .header__nav {
    flex-direction: row;
    gap: var(--space-5);
  }

  .header__link {
    border-bottom: 2px solid transparent;
  }

  .header__link.router-link-exact-active {
    border-bottom-color: var(--color-accent);
  }

  .header__user {
    flex-basis: auto;
  }
}
</style>
