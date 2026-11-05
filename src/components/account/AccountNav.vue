<template>
  <nav class="account-nav" :aria-label="$t('account.nav.ariaLabel')">
    <ul class="account-nav__list">
      <li v-for="item in items" :key="item.name">
        <RouterLink
          :to="{ name: item.name }"
          class="account-nav__link"
          active-class="is-active"
        >
          {{ $t(item.labelKey) }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<script>
export default {
  name: 'AccountNav',
  data() {
    return {
      items: [
        { name: 'client-account', labelKey: 'account.nav.summary' },
        { name: 'account-profile', labelKey: 'account.nav.profile' },
        { name: 'account-password', labelKey: 'account.nav.password' },
      ],
    }
  },
}
</script>

<style scoped>
.account-nav {
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-5);
}

.account-nav__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  list-style: none;
  margin: 0;
  padding: 0;
}

.account-nav__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--target-size);
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: 500;
}

.account-nav__link:hover {
  color: var(--color-text);
}

.account-nav__link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.account-nav__link.is-active {
  color: var(--color-on-primary);
  background: var(--color-primary);
}
</style>
