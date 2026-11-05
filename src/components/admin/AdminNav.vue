<template>
  <nav class="admin-nav" :aria-label="$t('admin.nav.ariaLabel')">
    <ul class="admin-nav__list">
      <li v-for="item in items" :key="item.name">
        <RouterLink
          :to="{ name: item.name }"
          class="admin-nav__link"
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
  name: 'AdminNav',
  data() {
    return {
      items: [
        { name: 'admin-home', labelKey: 'admin.nav.home' },
        { name: 'admin-categories', labelKey: 'admin.nav.categories' },
        { name: 'admin-menu', labelKey: 'admin.nav.menu' },
        { name: 'admin-settings', labelKey: 'admin.nav.settings' },
        { name: 'admin-users', labelKey: 'admin.nav.users' },
      ],
    }
  },
}
</script>

<style scoped>
.admin-nav {
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-5);
}

.admin-nav__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  list-style: none;
  margin: 0;
  padding: 0;
}

.admin-nav__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--target-size);
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: 500;
}

.admin-nav__link:hover {
  color: var(--color-text);
}

.admin-nav__link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.admin-nav__link.is-active {
  color: var(--color-on-primary);
  background: var(--color-primary);
}
</style>
