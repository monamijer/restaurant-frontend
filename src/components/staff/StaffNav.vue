<template>
  <nav class="staff-nav" :aria-label="$t('staff.nav.ariaLabel')">
    <ul class="staff-nav__list">
      <li v-for="item in items" :key="item.name">
        <RouterLink
          :to="{ name: item.name }"
          class="staff-nav__link"
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
  name: 'StaffNav',
  data() {
    return {
      items: [
        { name: 'staff-home', labelKey: 'staff.nav.home' },
        { name: 'staff-orders', labelKey: 'staff.nav.orders' },
        { name: 'staff-order-new', labelKey: 'staff.nav.newOrder' },
        { name: 'staff-reservations', labelKey: 'staff.nav.reservations' },
        { name: 'staff-queue', labelKey: 'staff.nav.queue' },
        { name: 'staff-tables', labelKey: 'staff.nav.tables' },
      ],
    };
  },
};
</script>

<style scoped>
.staff-nav {
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-5);
}

.staff-nav__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  list-style: none;
  margin: 0;
  padding: 0;
}

.staff-nav__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--target-size);
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: 500;
}

.staff-nav__link:hover {
  color: var(--color-text);
}

.staff-nav__link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.staff-nav__link.is-active {
  color: var(--color-on-primary);
  background: var(--color-primary);
}
</style>
