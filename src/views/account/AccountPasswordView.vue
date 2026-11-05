<template>
  <div class="account container">
    <AccountNav />

    <header>
      <h1>{{ $t('account.password.title') }}</h1>
      <p class="muted">{{ $t('account.password.subtitle') }}</p>
    </header>

    <form class="stack" novalidate @submit.prevent="submit">
      <FormAlert v-if="formError">{{ formError }}</FormAlert>

      <BaseInput
        v-model="draft.oldPassword"
        name="old_password"
        type="password"
        autocomplete="current-password"
        :label="$t('account.password.fields.current')"
        :error="errors.oldPassword"
        required
      />
      <BaseInput
        v-model="draft.newPassword"
        name="new_password"
        type="password"
        autocomplete="new-password"
        :label="$t('account.password.fields.new')"
        :error="errors.newPassword"
        required
      />
      <BaseInput
        v-model="draft.confirmPassword"
        name="confirm_password"
        type="password"
        autocomplete="new-password"
        :label="$t('account.password.fields.confirm')"
        :error="errors.confirmPassword"
        required
      />

      <div class="cluster">
        <BaseButton type="submit" :loading="submitting" :disabled="submitting">
          {{ $t('common.confirm') }}
        </BaseButton>
        <BaseButton type="button" variant="ghost" @click="$router.push({ name: 'client-account' })">
          {{ $t('common.cancel') }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<script>
import { mapActions } from 'pinia'
import AccountNav from '@/components/account/AccountNav.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import formErrors from '@/mixins/formErrors'
import { useAuthStore } from '@/store/auth'
import { useToastStore } from '@/store/toasts'

const MIN_LENGTH = 8

export default {
  name: 'AccountPasswordView',
  components: { AccountNav, BaseButton, BaseInput, FormAlert },
  mixins: [formErrors],
  data() {
    return {
      draft: { oldPassword: '', newPassword: '', confirmPassword: '' },
    }
  },
  methods: {
    ...mapActions(useAuthStore, ['changePassword']),

    validate() {
      const next = {}
      if (!this.draft.oldPassword) next.oldPassword = this.$t('account.password.validation.current')
      if (!this.draft.newPassword) next.newPassword = this.$t('account.password.validation.new')
      else if (this.draft.newPassword.length < MIN_LENGTH) {
        next.newPassword = this.$t('account.password.validation.tooShort', { count: MIN_LENGTH })
      } else if (this.draft.newPassword === this.draft.oldPassword) {
        next.newPassword = this.$t('account.password.validation.sameAsOld')
      }
      if (!this.draft.confirmPassword) next.confirmPassword = this.$t('account.password.validation.confirm')
      else if (this.draft.newPassword !== this.draft.confirmPassword) {
        next.confirmPassword = this.$t('account.password.validation.mismatch')
      }
      this.errors = next
      return Object.keys(next).length === 0
    },

    async submit() {
      if (this.submitting) return
      this.clearErrors()
      if (!this.validate()) return

      this.submitting = true
      try {
        await this.changePassword({
          oldPassword: this.draft.oldPassword,
          newPassword: this.draft.newPassword,
        })
        this.draft = { oldPassword: '', newPassword: '', confirmPassword: '' }
        useToastStore().success(this.$t('account.password.saved'))
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
.account {
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
</style>
