<template>
  <header class="header" :class="{ 'header--scrolled': scrolled }">
    <div class="header__top container">
      <RouterLink class="header__brand" :to="{ name: 'home' }">
        <svg class="header__mark" viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
          <rect width="64" height="64" rx="14" fill="currentColor" />
          <path
            d="M20 14v14a6 6 0 0 0 4 5.6V50h4V33.6A6 6 0 0 0 32 28V14h-3v11h-2V14h-3v11h-2V14zM44 14c-4 2-6 7-6 12 0 3 1 5 3 6v18h4V14z"
            fill="var(--color-accent)"
          />
        </svg>
        <span class="header__name">{{ name }}</span>
      </RouterLink>

      <form class="header__search" role="search" @submit.prevent="submitSearch">
        <label for="site-search" class="visually-hidden">{{ $t('header.search') }}</label>
        <svg class="header__search-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <path
            d="M9 3a6 6 0 1 1-3.7 10.7L2 17l1 1 3.3-3.3A6 6 0 0 1 9 3Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
            fill="currentColor"
          />
        </svg>
        <input
          id="site-search"
          v-model="search"
          type="search"
          class="header__search-input"
          :placeholder="$t('header.searchPlaceholder')"
          autocomplete="off"
          maxlength="100"
        />
      </form>

      <div class="header__actions">
        <NotificationBell v-if="isAuthenticated" />
        <CartLink />
        <LocaleSwitcher />
        <ThemeToggle />

        <BaseButton v-if="!isAuthenticated" size="sm" :to="{ name: 'login' }">
          {{ $t('header.login') }}
        </BaseButton>

        <button
          type="button"
          class="header__menu-button"
          aria-controls="site-drawer"
          :aria-expanded="drawerOpen ? 'true' : 'false'"
          :aria-label="drawerOpen ? $t('header.closeDrawer') : $t('header.openDrawer')"
          @click="drawerOpen = !drawerOpen"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>

    <nav class="header__nav container" :aria-label="$t('nav.label')">
      <RouterLink
        v-for="item in publicItems"
        :key="item.name"
        class="header__nav-link"
        :to="item.route"
      >
        {{ $t(item.labelKey) }}
      </RouterLink>
    </nav>

    <BaseDrawer
      :open="drawerOpen"
      :title="$t('header.drawerTitle')"
      @close="drawerOpen = false"
    >
      <nav :aria-label="$t('nav.label')" class="drawer-nav">
        <RouterLink
          v-for="item in allItems"
          :key="item.name"
          class="drawer-nav__link"
          :to="item.route"
          @click="drawerOpen = false"
        >
          {{ $t(item.labelKey) }}
        </RouterLink>
      </nav>

      <template #footer>
        <div v-if="isAuthenticated" class="drawer-account">
          <p class="muted">{{ $t('header.signedInAs', { name: fullName }) }}</p>
          <BaseButton variant="secondary" block @click="signOut">{{ $t('header.logout') }}</BaseButton>
        </div>
        <div v-else class="drawer-account">
          <BaseButton :to="{ name: 'login' }" block @click="drawerOpen = false">{{ $t('header.login') }}</BaseButton>
          <BaseButton variant="secondary" :to="{ name: 'register' }" block @click="drawerOpen = false">
            {{ $t('header.register') }}
          </BaseButton>
        </div>
      </template>
    </BaseDrawer>
  </header>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import CartLink from '@/components/cart/CartLink.vue'
import NotificationBell from '@/components/layout/NotificationBell.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseDrawer from '@/components/common/BaseDrawer.vue'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import { navItemsFor, publicNavItems } from '@/config/navigation'
import { useAuthStore } from '@/store/auth'
import { useRestaurantStore } from '@/store/restaurant'
import { useToastStore } from '@/store/toasts'

export default {
  name: 'AppHeader',
  components: { BaseButton, BaseDrawer, CartLink, LocaleSwitcher, NotificationBell, ThemeToggle },
  data() {
    return { drawerOpen: false, scrolled: false, search: '' }
  },
  computed: {
    ...mapState(useAuthStore, ['isAuthenticated', 'role', 'fullName']),
    ...mapState(useRestaurantStore, ['name']),
    publicItems() {
      return publicNavItems()
    },
    allItems() {
      return navItemsFor(this.role)
    },
  },
  watch: {
    '$route.fullPath'() {
      this.drawerOpen = false
    },
  },
  mounted() {
    window.addEventListener('scroll', this.onScroll, { passive: true })
    this.onScroll()
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.onScroll)
  },
  methods: {
    ...mapActions(useAuthStore, ['logout']),
    ...mapActions(useToastStore, ['info']),

    onScroll() {
      this.scrolled = window.scrollY > 8
    },

    submitSearch() {
      const q = this.search.trim()
      this.$router.push({ name: 'menu', query: q ? { q } : {} })
      this.search = ''
    },

    async signOut() {
      await this.logout()
      this.info(this.$t('auth.loggedOut'))
      this.drawerOpen = false
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
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  border-bottom: 1px solid var(--color-border);
  transition: backdrop-filter var(--duration-base) var(--ease-out), background-color var(--duration-base) var(--ease-out);
}

.header--scrolled {
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
  backdrop-filter: saturate(1.6) blur(12px);
  -webkit-backdrop-filter: saturate(1.6) blur(12px);
}

.header__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--header-height);
  padding-block: var(--space-2);
}

.header__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-primary);
  text-decoration: none;
  flex-shrink: 0;
}

.header__name {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
}

.header__search {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1 1 16rem;
  max-width: 32rem;
  min-height: var(--target-size);
  padding: 0 var(--space-3);
  background: var(--color-surface-sunken);
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  transition: border-color var(--duration-fast) var(--ease-out), background-color var(--duration-fast) var(--ease-out);
}

.header__search:focus-within {
  background: var(--color-surface);
  border-color: var(--color-border-strong);
}

.header__search-icon {
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.header__search-input {
  flex: 1;
  min-width: 0;
  padding: 0;
  font-size: var(--text-base);
  background: transparent;
  border: 0;
  outline: none;
}

.header__search-input::-webkit-search-cancel-button {
  display: none;
}

.header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

.header__menu-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--target-size);
  height: var(--target-size);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text);
}

.header__nav {
  display: flex;
  gap: var(--space-5);
  padding-block: var(--space-2) var(--space-3);
  overflow-x: auto;
  scrollbar-width: none;
}

.header__nav::-webkit-scrollbar {
  display: none;
}

.header__nav-link {
  flex-shrink: 0;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  padding-block: var(--space-1);
  border-bottom: 2px solid transparent;
  transition: color var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out);
}

.header__nav-link:hover {
  color: var(--color-text);
}

.header__nav-link.router-link-exact-active {
  color: var(--color-text);
  border-bottom-color: var(--color-accent);
}

.drawer-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.drawer-nav__link {
  display: flex;
  align-items: center;
  min-height: var(--target-size);
  padding: var(--space-2) 0;
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text);
  text-decoration: none;
  border-bottom: 1px solid var(--color-border);
}

.drawer-nav__link:last-child {
  border-bottom: 0;
}

.drawer-nav__link.router-link-exact-active {
  color: var(--color-accent-text);
}

.drawer-account {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

@media (max-width: 40em) {
  .header__search {
    order: 3;
    flex-basis: 100%;
    max-width: none;
  }
}

@media (max-width: 56em) {
  .header__nav {
    display: none;
  }
}
</style>
