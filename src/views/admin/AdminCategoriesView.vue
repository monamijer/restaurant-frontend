<template>
  <div class="admin-categories container">
    <AdminNav />

    <header class="head">
      <div>
        <h1>{{ $t('admin.categories.title') }}</h1>
        <p class="muted">{{ $t('admin.categories.subtitle') }}</p>
      </div>
      <BaseButton @click="openCreate">{{ $t('admin.categories.create') }}</BaseButton>
    </header>

    <FormAlert v-if="actionError" :message="actionError" />

    <EmptyState v-if="failed" :title="$t('admin.categories.failed')">
      <BaseButton variant="secondary" @click="fetchList">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <ul v-else-if="loading && items.length === 0" class="list" aria-hidden="true">
      <li v-for="n in 3" :key="n"><BaseSkeleton height="3rem" /></li>
    </ul>

    <EmptyState v-else-if="items.length === 0" :title="$t('admin.categories.empty')" />

    <ul v-else class="list">
      <li v-for="category in items" :key="category.id" class="card">
        <div>
          <p class="card__title">{{ category.name }}</p>
          <p class="muted card__meta">{{ category.slug }}</p>
        </div>
        <div class="cluster actions">
          <BaseButton size="sm" variant="secondary" @click="openEdit(category)">
            {{ $t('admin.categories.edit') }}
          </BaseButton>
          <BaseButton size="sm" variant="danger" @click="askDelete(category)">
            {{ $t('admin.categories.delete') }}
          </BaseButton>
        </div>
      </li>
    </ul>

    <BaseModal :open="formOpen" :title="formTitle" @close="closeForm">
      <form class="stack" novalidate @submit.prevent="submit">
        <FormAlert v-if="formError">{{ formError }}</FormAlert>

        <BaseInput
          v-model="draft.name"
          name="name"
          :label="$t('admin.categories.fields.name')"
          :error="errors.name"
        />
        <BaseInput
          v-model="draft.slug"
          name="slug"
          :label="$t('admin.categories.fields.slug')"
          :hint="$t('admin.categories.fields.slugHint')"
          :error="errors.slug"
          show-optional
        />

        <div class="cluster">
          <BaseButton type="submit" :loading="submitting" :disabled="submitting">
            {{ $t('common.confirm') }}
          </BaseButton>
          <BaseButton type="button" variant="ghost" @click="closeForm">
            {{ $t('common.cancel') }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <ConfirmDialog
      :open="deleteOpen"
      danger
      :title="$t('admin.categories.deleteTitle')"
      :message="$t('admin.categories.deleteMessage', { name: pendingDelete?.name })"
      :confirm-label="$t('admin.categories.deleteConfirm')"
      :cancel-label="$t('common.cancel')"
      :loading="deleting"
      @cancel="cancelDelete"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script>
import AdminNav from '@/components/admin/AdminNav.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import formErrors from '@/mixins/formErrors'
import { adminCategoryService } from '@/services/adminCategoryService'
import { useToastStore } from '@/store/toasts'
import { describeError } from '@/utils/errors'

export default {
  name: 'AdminCategoriesView',
  components: { AdminNav, BaseButton, BaseInput, BaseModal, BaseSkeleton, ConfirmDialog, EmptyState, FormAlert },
  mixins: [formErrors],
  data() {
    return {
      items: [],
      loading: false,
      failed: false,
      actionError: '',
      formOpen: false,
      editing: null,
      draft: { name: '', slug: '' },
      deleteOpen: false,
      pendingDelete: null,
      deleting: false,
    }
  },
  computed: {
    formTitle() {
      return this.editing ? this.$t('admin.categories.editTitle') : this.$t('admin.categories.createTitle')
    },
  },
  created() {
    this.fetchList()
  },
  methods: {
    async fetchList() {
      this.loading = true
      this.failed = false
      try {
        this.items = await adminCategoryService.list()
      } catch {
        this.failed = true
      } finally {
        this.loading = false
      }
    },

    openCreate() {
      this.editing = null
      this.draft = { name: '', slug: '' }
      this.clearErrors()
      this.formOpen = true
    },

    openEdit(category) {
      this.editing = category
      this.draft = { name: category.name, slug: category.slug }
      this.clearErrors()
      this.formOpen = true
    },

    closeForm() {
      if (this.submitting) return
      this.formOpen = false
      this.editing = null
    },

    async submit() {
      if (this.submitting) return
      this.clearErrors()
      if (!this.draft.name.trim()) {
        this.errors = { name: this.$t('admin.categories.validation.name') }
        return
      }
      this.submitting = true
      try {
        const payload = { name: this.draft.name.trim() }
        if (this.draft.slug.trim()) payload.slug = this.draft.slug.trim()
        if (this.editing) await adminCategoryService.update(this.editing.id, payload)
        else await adminCategoryService.create(payload)
        useToastStore().success(this.$t('admin.categories.saved'))
        this.formOpen = false
        await this.fetchList()
      } catch (error) {
        this.showApiError(error)
      } finally {
        this.submitting = false
      }
    },

    askDelete(category) {
      this.pendingDelete = category
      this.deleteOpen = true
    },

    cancelDelete() {
      this.deleteOpen = false
      this.pendingDelete = null
    },

    async confirmDelete() {
      if (!this.pendingDelete) return
      this.deleting = true
      this.actionError = ''
      try {
        await adminCategoryService.remove(this.pendingDelete.id)
        useToastStore().success(this.$t('admin.categories.deleted'))
        this.deleteOpen = false
        this.pendingDelete = null
        await this.fetchList()
      } catch (error) {
        this.actionError = describeError(error, this.$t.bind(this))
      } finally {
        this.deleting = false
      }
    },
  },
}
</script>

<style scoped>
.admin-categories {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-6);
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-3);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0;
  list-style: none;
}

.card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.card__title {
  font-weight: 700;
}

.card__meta {
  font-size: var(--text-sm);
}

.actions {
  flex-wrap: wrap;
  justify-content: end;
}
</style>
