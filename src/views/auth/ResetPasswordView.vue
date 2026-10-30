<template>
  <section aria-labelledby="reset-title">
    <h1 id="reset-title" class="auth-title">{{ $t('auth.reset.title') }}</h1>

    <template v-if="linkInvalid">
      <FormAlert>{{ $t('auth.reset.invalidLink') }}</FormAlert>
      <p class="auth-links">
        <router-link :to="{ name: 'forgot-password' }">{{ $t('auth.reset.requestNew') }}</router-link>
      </p>
    </template>

    <template v-else>
      <p class="muted auth-lead">{{ $t('auth.reset.lead') }}</p>
      <form class="stack" novalidate @submit.prevent="submit">
        <FormAlert v-if="formError">{{ formError }}</FormAlert>
        <BaseInput
          v-model="password"
          type="password"
          name="new_password"
          autocomplete="new-password"
          :label="$t('auth.newPassword')"
          :hint="$t('auth.passwordHint')"
          :error="errors.password"
          required
        />
        <BaseInput
          v-model="confirmation"
          type="password"
          name="confirm_password"
          autocomplete="new-password"
          :label="$t('auth.confirmPassword')"
          :error="errors.confirmation"
          required
        />
        <BaseButton type="submit" block :loading="submitting">{{ $t('auth.reset.submit') }}</BaseButton>
      </form>
    </template>
  </section>
</template>

<script>
import { mapActions } from 'pinia'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import formErrors from '@/mixins/formErrors'
import { authService } from '@/services/authService'
import { useToastStore } from '@/store/toasts'
import { isBlank } from '@/utils/validation'

export default {
  name: 'ResetPasswordView',
  components: { BaseButton, BaseInput, FormAlert },
  mixins: [formErrors],
  data() {
    const { uid, token } = this.$route.query
    return {
      password: '',
      confirmation: '',
      // A link without both parts, or one the backend refuses, cannot be used.
      linkInvalid: typeof uid !== 'string' || typeof token !== 'string' || !uid || !token,
    }
  },
  methods: {
    ...mapActions(useToastStore, ['success']),

    validate() {
      const errors = {}
      if (isBlank(this.password)) errors.password = this.$t('auth.validation.required')
      if (this.confirmation !== this.password) errors.confirmation = this.$t('auth.validation.passwordMismatch')
      this.errors = errors
      return Object.keys(errors).length === 0
    },

    async submit() {
      this.clearErrors()
      if (!this.validate()) return

      this.submitting = true
      try {
        await authService.confirmPasswordReset({
          uid: this.$route.query.uid,
          token: this.$route.query.token,
          newPassword: this.password,
        })
        this.success(this.$t('auth.reset.success'))
        await this.$router.replace({ name: 'login' })
      } catch (error) {
        this.showApiError(error)
        if (this.errors.token) {
          this.linkInvalid = true
        } else if (this.errors.new_password) {
          this.errors = { password: this.errors.new_password }
        }
      } finally {
        this.submitting = false
      }
    },
  },
}
</script>

<style scoped>
.auth-title {
  font-size: var(--text-2xl);
}

.auth-lead {
  margin-block: var(--space-2) var(--space-5);
}

.auth-links {
  margin-top: var(--space-4);
  font-size: var(--text-sm);
}
</style>
