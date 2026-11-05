<template>
  <div class="admin-menu-item container">
    <AdminNav />

    <header>
      <h1>{{ $t('admin.menu.form.newTitle') }}</h1>
      <p class="muted">{{ $t('admin.menu.form.newSubtitle') }}</p>
    </header>

    <p v-if="loading" class="muted" role="status">{{ $t('admin.menu.form.loading') }}</p>

    <MenuItemForm
      v-else
      :categories="categories"
      @saved="onSaved"
      @cancel="$router.push({ name: 'admin-menu' })"
    />
  </div>
</template>

<script>
import AdminNav from '@/components/admin/AdminNav.vue'
import MenuItemForm from '@/views/admin/MenuItemForm.vue'
import { menuService } from '@/services/menuService'

export default {
  name: 'AdminMenuItemNewView',
  components: { AdminNav, MenuItemForm },
  data() {
    return { categories: [], loading: true }
  },
  async created() {
    try {
      this.categories = await menuService.categories()
    } catch {
      this.categories = []
    } finally {
      this.loading = false
    }
  },
  methods: {
    onSaved(item) {
      this.$router.push({ name: 'admin-menu-item-edit', params: { id: item.id } })
    },
  },
}
</script>

<style scoped>
.admin-menu-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-6);
  max-width: 42rem;
}
</style>
