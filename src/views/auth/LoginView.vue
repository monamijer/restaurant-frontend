<template>
  <section aria-labelledby="login-title">
    <h1 id="login-title" class="auth-title">{{ $t('auth.login.title') }}</h1>
    <p class="muted auth-lead">{{ $t('auth.login.lead') }}</p>

    <form class="stack" novalidate @submit.prevent="submit">
      <FormAlert v-if="formError">{{ formError }}</FormAlert>

      <BaseInput
        v-model="email"
        type="email"
        name="email"
        autocomplete="username"
        inputmode="email"
        :label="$t('auth.email')"
        :error="errors.email"
        required
      />
      <BaseInput
        v-model="password"
        type="password"
        name="password"
        autocomplete="current-password"
        :label="$t('auth.password')"
        :error="errors.password"
        required
      />

      <BaseButton type="submit" block :loading="submitting">{{ $t('auth.login.submit') }}</BaseButton>
    </form>

    <p class="auth-links">
      <router-link :to="{ name: 'forgot-password' }">{{ $t('auth.login.forgot') }}</router-link>
    </p>
    <p class="muted auth-links">
      {{ $t('auth.login.noAccount') }}
      <router-link :to="{ name: 'register', query: carriedQuery }">{{ $t('auth.login.createAccount') }}</router-link>
    </p>
  </section>
</template>

<script>
import { mapActions } from 'pinia'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import formErrors from '@/mixins/formErrors'
import { useAuthStore } from '@/store/auth'
import { isBlank, isEmail } from '@/utils/validation'
import { homeRouteFor } from '@/utils/roles'
import { safeRedirect } from '@/utils/redirect'

export default {
  name: 'LoginView',
  components: { BaseButton, BaseInput, FormAlert },
  mixins: [formErrors],
  data() {
    return { email: '', password: '' }
  },
  computed: {
    // The page the visitor was heading to is kept when they switch to registration.
    carriedQuery() {
      const { redirect } = this.$route.query
      return redirect ? { redirect } : {}
    },
  },
  methods: {
    ...mapActions(useAuthStore, ['login']),

    validate() {
      const errors = {}
      if (isBlank(this.email)) errors.email = this.$t('auth.validation.required')
      else if (!isEmail(this.email)) errors.email = this.$t('auth.validation.email')
      if (isBlank(this.password)) errors.password = this.$t('auth.validation.required')
      this.errors = errors
      return Object.keys(errors).length === 0
    },

    async submit() {
      this.clearErrors()
      if (!this.validate()) return

      this.submitting = true
      try {
        const user = await this.login({ email: this.email.trim(), password: this.password })
        const target = safeRedirect(this.$route.query.redirect, null)
        await this.$router.replace(target ?? { name: homeRouteFor(user.role) })
      } catch (error) {
        this.showApiError(error, { 401: this.$t('auth.login.invalidCredentials') })
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
