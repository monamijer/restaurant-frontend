<template>
  <div class="admin-user container">
    <AdminNav />

    <header>
      <h1>{{ $t('admin.users.newTitle') }}</h1>
      <p class="muted">{{ $t('admin.users.newSubtitle') }}</p>
    </header>

    <form class="stack" novalidate @submit.prevent="submit">
      <FormAlert v-if="formError">{{ formError }}</FormAlert>

      <BaseInput
        v-model="draft.email"
        name="email"
        type="email"
        autocomplete="email"
        :label="$t('admin.users.fields.email')"
        :error="errors.email"
        required
      />
      <BaseInput
        v-model="draft.password"
        name="password"
        type="password"
        autocomplete="new-password"
        :label="$t('admin.users.fields.password')"
        :error="errors.password"
        required
      />
      <div class="grid">
        <BaseInput
          v-model="draft.firstName"
          name="first_name"
          autocomplete="given-name"
          :label="$t('admin.users.fields.firstName')"
          :error="errors.firstName"
        />
        <BaseInput
          v-model="draft.lastName"
          name="last_name"
          autocomplete="family-name"
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
        <select id="user-role" v-model="draft.role" class="control">
          <option value="client">{{ $t('admin.users.roles.client') }}</option>
          <option value="staff">{{ $t('admin.users.roles.staff') }}</option>
          <option value="admin">{{ $t('admin.users.roles.admin') }}</option>
        </select>
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
  </div>
</template>

<script>
import AdminNav from '@/components/admin/AdminNav.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import formErrors from '@/mixins/formErrors'
import { adminUserService } from '@/services/adminUserService'
import { useToastStore } from '@/store/toasts'
import { isEmail } from '@/utils/validation'

export default {
  name: 'AdminUserNewView',
  components: { AdminNav, BaseButton, BaseInput, FormAlert },
  mixins: [formErrors],
  data() {
    return {
      draft: {
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        role: 'client',
      },
    }
  },
  methods: {
    validate() {
      const next = {}
      if (!isEmail(this.draft.email)) next.email = this.$t('admin.users.validation.email')
      if (!this.draft.password) next.password = this.$t('admin.users.validation.password')
      this.errors = next
      return Object.keys(next).length === 0
    },

    async submit() {
      if (this.submitting) return
      this.clearErrors()
      if (!this.validate()) return

      const payload = {
        email: this.draft.email.trim(),
        password: this.draft.password,
        first_name: this.draft.firstName.trim(),
        last_name: this.draft.lastName.trim(),
        phone: this.draft.phone.trim(),
        address: this.draft.address.trim(),
        role: this.draft.role,
      }

      this.submitting = true
      try {
        const created = await adminUserService.create(payload)
        useToastStore().success(this.$t('admin.users.created'))
        this.$router.push({ name: 'admin-user-edit', params: { id: created.id } })
      } catch (error) {
        this.showApiError(error)
      } finally {
        this.submitting = false
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

.control {
  min-height: var(--target-size);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: inherit;
  font: inherit;
}
</style>
