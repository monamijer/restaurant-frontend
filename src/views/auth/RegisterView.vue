<template>
  <section aria-labelledby="register-title">
    <h1 id="register-title" class="auth-title">{{ $t('auth.register.title') }}</h1>
    <p class="muted auth-lead">{{ $t('auth.register.lead') }}</p>

    <form class="stack" novalidate @submit.prevent="submit">
      <FormAlert v-if="formError">{{ formError }}</FormAlert>

      <div class="register-names">
        <BaseInput
          v-model="firstName"
          name="first_name"
          autocomplete="given-name"
          :label="$t('auth.firstName')"
          :error="errors.first_name"
          required
        />
        <BaseInput
          v-model="lastName"
          name="last_name"
          autocomplete="family-name"
          :label="$t('auth.lastName')"
          :error="errors.last_name"
          required
        />
      </div>
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
      <BaseInput
        v-model="phone"
        type="tel"
        name="phone"
        autocomplete="tel"
        inputmode="tel"
        :label="$t('auth.phone')"
        :error="errors.phone"
        show-optional
      />
      <BaseInput
        v-model="password"
        type="password"
        name="password"
        autocomplete="new-password"
        :label="$t('auth.password')"
        :hint="$t('auth.passwordHint')"
        :error="errors.password"
        required
      />

      <BaseButton type="submit" block :loading="submitting">{{ $t('auth.register.submit') }}</BaseButton>
    </form>

    <p class="muted auth-links">
      {{ $t('auth.register.haveAccount') }}
      <router-link :to="{ name: 'login', query: carriedQuery }">{{ $t('auth.register.login') }}</router-link>
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
import { useToastStore } from '@/store/toasts'
import { homeRouteFor } from '@/utils/roles'
import { safeRedirect } from '@/utils/redirect'
import { isBlank, isEmail } from '@/utils/validation'

export default {
  name: 'RegisterView',
  components: { BaseButton, BaseInput, FormAlert },
  mixins: [formErrors],
  data() {
    return { firstName: '', lastName: '', email: '', phone: '', password: '' }
  },
  computed: {
    carriedQuery() {
      const { redirect } = this.$route.query
      return redirect ? { redirect } : {}
    },
  },
  methods: {
    ...mapActions(useAuthStore, ['register']),
    ...mapActions(useToastStore, ['success']),

    validate() {
      const errors = {}
      const required = this.$t('auth.validation.required')
      if (isBlank(this.firstName)) errors.first_name = required
      if (isBlank(this.lastName)) errors.last_name = required
      if (isBlank(this.email)) errors.email = required
      else if (!isEmail(this.email)) errors.email = this.$t('auth.validation.email')
      if (isBlank(this.password)) errors.password = required
      this.errors = errors
      return Object.keys(errors).length === 0
    },

    async submit() {
      this.clearErrors()
      if (!this.validate()) return

      this.submitting = true
      try {
        const user = await this.register({
          email: this.email.trim(),
          password: this.password,
          first_name: this.firstName.trim(),
          last_name: this.lastName.trim(),
          phone: this.phone.trim(),
        })
        this.success(this.$t('auth.register.welcome', { name: user.first_name }))
        const target = safeRedirect(this.$route.query.redirect, null)
        await this.$router.replace(target ?? { name: homeRouteFor(user.role) })
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

.register-names {
  display: grid;
  gap: var(--space-4);
}

@media (min-width: 30em) {
  .register-names {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
