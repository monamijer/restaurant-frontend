<template>
  <div class="admin-user container">
    <AdminNav />

    <EmptyState v-if="failed" :title="$t('admin.users.loadFailed')">
      <BaseButton variant="secondary" @click="load">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <p v-else-if="loading" class="muted" role="status">{{ $t('admin.users.loading') }}</p>

    <template v-else-if="target">
      <header class="head">
        <div>
          <h1>{{ fullName(target) }}</h1>
          <p class="muted">{{ target.email }}</p>
        </div>
        <BaseBadge :tone="target.is_active ? 'success' : 'neutral'">
          {{ target.is_active ? $t('admin.users.active') : $t('admin.users.inactive') }}
        </BaseBadge>
      </header>

      <FormAlert v-if="actionError" :message="actionError" />

      <form class="stack" novalidate @submit.prevent="submit">
        <FormAlert v-if="formError">{{ formError }}</FormAlert>

        <div class="grid">
          <BaseInput
            v-model="draft.firstName"
            name="first_name"
            :label="$t('admin.users.fields.firstName')"
            :error="errors.firstName"
          />
          <BaseInput
            v-model="draft.lastName"
            name="last_name"
            :label="$t('admin.users.fields.lastName')"
            :error="errors.lastName"
          />
        </div>
        <BaseInput
          v-model="draft.phone"
          name="phone"
          type="tel"
          inputmode="tel"
          :label="$t('admin.users.fields.phone')"
          :error="errors.phone"
          show-optional
        />
        <BaseInput
          v-model="draft.address"
          name="address"
          :label="$t('admin.users.fields.address')"
          :error="errors.address"
          show-optional
        />

        <div class="field">
          <label class="field__label" for="user-role">{{ $t('admin.users.fields.role') }}</label>
          <select
            id="user-role"
            v-model="draft.role"
            class="control"
            :disabled="isSelf"
          >
            <option value="client">{{ $t('admin.users.roles.client') }}</option>
            <option value="staff">{{ $t('admin.users.roles.staff') }}</option>
            <option value="admin">{{ $t('admin.users.roles.admin') }}</option>
          </select>
          <p v-if="isSelf" class="muted field__hint">{{ $t('admin.users.selfRoleHint') }}</p>
        </div>

        <div class="cluster">
          <BaseButton type="submit" :loading="submitting" :disabled="submitting">
            {{ $t('common.confirm') }}
          </BaseButton>
          <BaseButton type="button" variant="ghost" @click="$router.push({ name: 'admin-users' })">
            {{ $t('common.cancel') }}
          </BaseButton>
        </div>
      </form>

      <section class="panel">
        <h2>{{ $t('admin.users.securityTitle') }}</h2>
        <div class="cluster">
          <BaseButton variant="secondary" @click="openPassword">{{ $t('admin.users.changePassword') }}</BaseButton>
          <BaseButton
            v-if="!isSelf"
            :variant="target.is_active ? 'danger' : 'primary'"
            @click="askToggleActive"
          >
            {{ target.is_active ? $t('admin.users.deactivate') : $t('admin.users.activate') }}
          </BaseButton>
          <p v-if="isSelf" class="muted">{{ $t('admin.users.selfDeactivateHint') }}</p>
        </div>
      </section>
    </template>

    <BaseModal :open="passwordOpen" :title="$t('admin.users.changePassword')" @close="closePassword">
      <form id="password-form" class="stack" novalidate @submit.prevent="savePassword">
        <FormAlert v-if="passwordError">{{ passwordError }}</FormAlert>
        <BaseInput
          v-model="newPassword"
          name="new_password"
          type="password"
          autocomplete="new-password"
          :label="$t('admin.users.fields.newPassword')"
          required
        />
      </form>
      <template #footer>
        <BaseButton type="button" variant="ghost" @click="closePassword">
          {{ $t('common.cancel') }}
        </BaseButton>
        <BaseButton
          type="submit"
          form="password-form"
          :loading="savingPassword"
          :disabled="savingPassword"
        >
          {{ $t('common.confirm') }}
        </BaseButton>
      </template>
    </BaseModal>

    <ConfirmDialog
      :open="toggleOpen"
      :danger="target?.is_active"
      :title="target?.is_active ? $t('admin.users.deactivateTitle') : $t('admin.users.activateTitle')"
      :message="target?.is_active ? $t('admin.users.deactivateMessage') : $t('admin.users.activateMessage')"
      :confirm-label="target?.is_active ? $t('admin.users.deactivateConfirm') : $t('admin.users.activateConfirm')"
      :cancel-label="$t('common.cancel')"
      :loading="toggling"
      @cancel="toggleOpen = false"
      @confirm="toggleActive"
    />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import AdminNav from '@/components/admin/AdminNav.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import formErrors from '@/mixins/formErrors'
import { adminUserService } from '@/services/adminUserService'
import { useAuthStore } from '@/store/auth'
import { useToastStore } from '@/store/toasts'
import { describeError } from '@/utils/errors'

export default {
  name: 'AdminUserEditView',
  components: {
    AdminNav, BaseBadge, BaseButton, BaseInput, BaseModal, ConfirmDialog, EmptyState, FormAlert,
  },
  mixins: [formErrors],
  data() {
    return {
      target: null,
      loading: true,
      failed: false,
      actionError: '',
      draft: { firstName: '', lastName: '', phone: '', address: '', role: 'client' },
      passwordOpen: false,
      newPassword: '',
      passwordError: '',
      savingPassword: false,
      toggleOpen: false,
      toggling: false,
    }
  },
  computed: {
    ...mapState(useAuthStore, ['user']),
    isSelf() {
      return this.user?.id === this.target?.id
    },
  },
  created() {
    this.load()
  },
  methods: {
    fullName(user) {
      const name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
      return name || user.email
    },

    async load() {
      this.loading = true
      this.failed = false
      try {
        const target = await adminUserService.get(this.$route.params.id)
        this.target = target
        this.draft = {
          firstName: target.first_name || '',
          lastName: target.last_name || '',
          phone: target.phone || '',
          address: target.address || '',
          role: target.role,
        }
      } catch {
        this.failed = true
      } finally {
        this.loading = false
      }
    },

    async submit() {
      if (this.submitting) return
      this.clearErrors()
      this.submitting = true
      try {
        const updated = await adminUserService.update(this.target.id, {
          first_name: this.draft.firstName.trim(),
          last_name: this.draft.lastName.trim(),
          phone: this.draft.phone.trim(),
          address: this.draft.address.trim(),
          role: this.draft.role,
        })
        this.target = updated
        useToastStore().success(this.$t('admin.users.saved'))
      } catch (error) {
        this.showApiError(error)
      } finally {
        this.submitting = false
      }
    },

    openPassword() {
      this.newPassword = ''
      this.passwordError = ''
      this.passwordOpen = true
    },

    closePassword() {
      if (this.savingPassword) return
      this.passwordOpen = false
    },

    async savePassword() {
      if (this.savingPassword) return
      if (!this.newPassword) {
        this.passwordError = this.$t('admin.users.validation.password')
        return
      }
      this.savingPassword = true
      this.passwordError = ''
      try {
        await adminUserService.setPassword(this.target.id, this.newPassword)
        useToastStore().success(this.$t('admin.users.passwordSaved'))
        this.passwordOpen = false
        this.newPassword = ''
      } catch (error) {
        this.passwordError = describeError(error, this.$t.bind(this))
      } finally {
        this.savingPassword = false
      }
    },

    askToggleActive() {
      this.toggleOpen = true
    },

    async toggleActive() {
      this.toggling = true
      this.actionError = ''
      try {
        this.target = await adminUserService.setActive(this.target.id, !this.target.is_active)
        useToastStore().success(this.$t('admin.users.toggled'))
        this.toggleOpen = false
      } catch (error) {
        this.actionError = describeError(error, this.$t.bind(this))
      } finally {
        this.toggling = false
      }
    },
  },
}
</script>

<style scoped>
.admin-user {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-6);
  max-width: 42rem;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-3);
}

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-sm);
}

.field__label {
  font-size: var(--text-sm);
  font-weight: 600;
}

.field__hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.control {
  min-height: var(--target-size);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: inherit;
  font: inherit;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
</style>
