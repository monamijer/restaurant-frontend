<template>
  <div class="admin-home container">
    <AdminNav />

    <header>
      <h1>{{ $t('admin.home.title') }}</h1>
      <p class="muted">{{ $t('admin.home.subtitle') }}</p>
    </header>

    <section class="shortcuts">
      <h2>{{ $t('admin.home.shortcutsTitle') }}</h2>
      <ul class="shortcuts__list">
        <li v-for="shortcut in shortcuts" :key="shortcut.name">
          <RouterLink class="shortcut" :to="{ name: shortcut.name }">
            <span class="shortcut__title">{{ $t(shortcut.titleKey) }}</span>
            <span class="muted shortcut__desc">{{ $t(shortcut.descriptionKey) }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import AdminNav from '@/components/admin/AdminNav.vue'

export default {
  name: 'AdminHomeView',
  components: { AdminNav },
  data() {
    return {
      shortcuts: [
        {
          name: 'admin-categories',
          titleKey: 'admin.home.shortcuts.categories',
          descriptionKey: 'admin.home.shortcuts.categoriesHint',
        },
        {
          name: 'admin-menu',
          titleKey: 'admin.home.shortcuts.menu',
          descriptionKey: 'admin.home.shortcuts.menuHint',
        },
      ],
    }
  },
}
</script>

<style scoped>
.admin-home {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-6);
}

.shortcuts h2 {
  font-size: var(--text-lg);
  margin-bottom: var(--space-3);
}

.shortcuts__list {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  padding: 0;
  list-style: none;
}

.shortcut {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: inherit;
  text-decoration: none;
}

.shortcut:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
}

.shortcut__title {
  font-weight: 700;
}

.shortcut__desc {
  font-size: var(--text-sm);
}
</style>
