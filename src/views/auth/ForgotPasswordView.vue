<template>
  <section aria-labelledby="forgot-title">
    <h1 id="forgot-title" class="auth-title">{{ $t('auth.forgot.title') }}</h1>

    <template v-if="sent">
      <p class="auth-lead" role="status">{{ $t('auth.forgot.sent') }}</p>
    </template>
    <template v-else>
      <p class="muted auth-lead">{{ $t('auth.forgot.lead') }}</p>
      <form class="stack" novalidate @submit.prevent="submit">
        <FormAlert v-if="formError">{{ formError }}</FormAlert>
        <BaseInput
          v-model="email"
          type="email"
          name="email"
          autocomplete="email"
          inputmode="email"
          :label="$t('auth.email')"
          :error="errors.email"
          required
        />
        <BaseButton type="submit" block :loading="submitting">{{ $t('auth.forgot.submit') }}</BaseButton>
      </form>
    </template>

    <p class="auth-links">
      <router-link :to="{ name: 'login' }">{{ $t('auth.forgot.back') }}</router-link>
    </p>
  </section>
</template>

<script>
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import formErrors from '@/mixins/formErrors'
import { authService } from '@/services/authService'
import { isBlank, isEmail } from '@/utils/validation'

export default {
  name: 'ForgotPasswordView',
  components: { BaseButton, BaseInput, FormAlert },
  mixins: [formErrors],
  data() {
    return { email: '', sent: false }
  },
  methods: {
    async submit() {
      this.clearErrors()
      if (isBlank(this.email)) {
        this.errors = { email: this.$t('auth.validation.required') }
        return
      }
      if (!isEmail(this.email)) {
        this.errors = { email: this.$t('auth.validation.email') }
        return
      }

      this.submitting = true
      try {
        await authService.requestPasswordReset(this.email.trim())
        this.sent = true // The backend answers the same whether or not the address exists.
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
