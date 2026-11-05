<template>
  <div class="admin-menu-item container">
    <AdminNav />

    <header>
      <h1>{{ $t('admin.menu.form.editTitle') }}</h1>
      <p class="muted">{{ $t('admin.menu.form.editSubtitle') }}</p>
    </header>

    <EmptyState v-if="failed" :title="$t('admin.menu.form.loadFailed')">
      <BaseButton variant="secondary" @click="load">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <p v-else-if="loading" class="muted" role="status">{{ $t('admin.menu.form.loading') }}</p>

    <MenuItemForm
      v-else
      :item="item"
      :categories="categories"
      @saved="onSaved"
      @cancel="$router.push({ name: 'admin-menu' })"
    />
  </div>
</template>

<script>
import AdminNav from '@/components/admin/AdminNav.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import MenuItemForm from '@/views/admin/MenuItemForm.vue'
import { adminMenuService } from '@/services/adminMenuService'
import { menuService } from '@/services/menuService'
import { useToastStore } from '@/store/toasts'

export default {
  name: 'AdminMenuItemEditView',
  components: { AdminNav, BaseButton, EmptyState, MenuItemForm },
  data() {
    return { item: null, categories: [], loading: true, failed: false }
  },
  watch: {
    '$route.params.id'() {
      this.load()
    },
  },
  async created() {
    await Promise.all([this.loadCategories(), this.load()])
  },
  methods: {
    async loadCategories() {
      try {
        this.categories = await menuService.categories()
      } catch {
        this.categories = []
      }
    },

    async load() {
      this.loading = true
      this.failed = false
      try {
        this.item = await adminMenuService.get(this.$route.params.id)
      } catch {
        this.failed = true
      } finally {
        this.loading = false
      }
    },

    onSaved() {
      useToastStore().success(this.$t('admin.menu.form.saved'))
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
