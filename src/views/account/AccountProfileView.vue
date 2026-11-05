<template>
  <div class="account container">
    <AccountNav />

    <header>
      <h1>{{ $t('account.profile.title') }}</h1>
      <p class="muted">{{ $t('account.profile.subtitle') }}</p>
    </header>

    <dl class="readonly">
      <div>
        <dt>{{ $t('account.email') }}</dt>
        <dd>{{ user.email }}</dd>
      </div>
      <div>
        <dt>{{ $t('account.role') }}</dt>
        <dd><BaseBadge tone="info">{{ $t(`account.roles.${user.role}`) }}</BaseBadge></dd>
      </div>
    </dl>

    <form class="stack" novalidate @submit.prevent="submit">
      <FormAlert v-if="formError">{{ formError }}</FormAlert>

      <div class="grid">
        <BaseInput
          v-model="draft.firstName"
          name="first_name"
          autocomplete="given-name"
          :label="$t('account.profile.fields.firstName')"
          :error="errors.firstName"
        />
        <BaseInput
          v-model="draft.lastName"
          name="last_name"
          autocomplete="family-name"
          :label="$t('account.profile.fields.lastName')"
          :error="errors.lastName"
        />
      </div>
      <BaseInput
        v-model="draft.phone"
        name="phone"
        type="tel"
        inputmode="tel"
        autocomplete="tel"
        :label="$t('account.profile.fields.phone')"
        :error="errors.phone"
        show-optional
      />
      <BaseInput
        v-model="draft.address"
        name="address"
        autocomplete="street-address"
        :label="$t('account.profile.fields.address')"
        :error="errors.address"
        show-optional
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
import { mapActions, mapState } from 'pinia'
import AccountNav from '@/components/account/AccountNav.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import formErrors from '@/mixins/formErrors'
import { useAuthStore } from '@/store/auth'
import { useToastStore } from '@/store/toasts'

export default {
  name: 'AccountProfileView',
  components: { AccountNav, BaseBadge, BaseButton, BaseInput, FormAlert },
  mixins: [formErrors],
  computed: {
    ...mapState(useAuthStore, ['user']),
  },
  data() {
    return {
      draft: {
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
      },
    }
  },
  created() {
    this.hydrate()
  },
  methods: {
    ...mapActions(useAuthStore, ['updateProfile']),

    hydrate() {
      this.draft = {
        firstName: this.user?.first_name || '',
        lastName: this.user?.last_name || '',
        phone: this.user?.phone || '',
        address: this.user?.address || '',
      }
    },

    validate() {
      const next = {}
      if (!this.draft.firstName.trim()) next.firstName = this.$t('account.profile.validation.firstName')
      if (!this.draft.lastName.trim()) next.lastName = this.$t('account.profile.validation.lastName')
      this.errors = next
      return Object.keys(next).length === 0
    },

    async submit() {
      if (this.submitting) return
      this.clearErrors()
      if (!this.validate()) return

      this.submitting = true
      try {
        await this.updateProfile({
          first_name: this.draft.firstName.trim(),
          last_name: this.draft.lastName.trim(),
          phone: this.draft.phone.trim(),
          address: this.draft.address.trim(),
        })
        useToastStore().success(this.$t('account.profile.saved'))
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

.readonly {
  display: grid;
  gap: var(--space-3);
  margin: 0;
}

.readonly div {
  display: grid;
  gap: var(--space-1);
}

.readonly dt {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.readonly dd {
  margin: 0;
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
</style>
