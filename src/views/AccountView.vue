<template>
  <div class="account container">
    <header class="account__header">
      <p class="eyebrow">{{ $t('account.title') }}</p>
      <h1>{{ $t('account.heading', { name: user.first_name }) }}</h1>
    </header>

    <section class="account__card" aria-labelledby="details-title">
      <h2 id="details-title" class="account__card-title">{{ $t('account.details') }}</h2>
      <dl class="account__list">
        <div>
          <dt>{{ $t('account.email') }}</dt>
          <dd>{{ user.email }}</dd>
        </div>
        <div>
          <dt>{{ $t('account.phone') }}</dt>
          <dd>{{ user.phone || $t('account.notProvided') }}</dd>
        </div>
        <div>
          <dt>{{ $t('account.role') }}</dt>
          <dd><BaseBadge tone="info">{{ $t(`account.roles.${user.role}`) }}</BaseBadge></dd>
        </div>
        <div>
          <dt>{{ $t('account.memberSince') }}</dt>
          <dd>{{ memberSince }}</dd>
        </div>
      </dl>
    </section>

    <nav class="account__links" :aria-label="$t('account.links.heading')">
      <BaseButton variant="secondary" :to="{ name: 'orders' }">{{ $t('account.links.orders') }}</BaseButton>
      <BaseButton variant="secondary" :to="{ name: 'reservations' }">{{ $t('account.links.reservations') }}</BaseButton>
      <BaseButton variant="secondary" :to="{ name: 'invoices' }">{{ $t('account.links.invoices') }}</BaseButton>
      <BaseButton variant="secondary" :to="{ name: 'notifications' }">{{ $t('account.links.notifications') }}</BaseButton>
    </nav>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useAuthStore } from '@/store/auth'
import { useUiStore } from '@/store/ui'
import { formatDateTime } from '@/utils/format'

export default {
  name: 'AccountView',
  components: { BaseBadge, BaseButton },
  computed: {
    ...mapState(useAuthStore, ['user']),
    ...mapState(useUiStore, ['locale']),
    memberSince() {
      return formatDateTime(this.user.created_at, this.locale)
    },
  },
  async mounted() {
    try {
      await this.refreshUser() // Show what the server knows now, not what the login returned.
    } catch {
      // The profile already on screen is good enough; a real failure surfaces on the next action.
    }
  },
  methods: {
    ...mapActions(useAuthStore, ['refreshUser']),
  },
}
</script>

<style scoped>
.account {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-7);
}

.account__card {
  max-width: 36rem;
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.account__card-title {
  margin-bottom: var(--space-4);
  font-size: var(--text-xl);
}

.account__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.account__list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
}

.account__list div {
  display: grid;
  gap: var(--space-1);
}

.account__list dt {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.account__list dd {
  margin: 0;
}

@media (min-width: 40em) {
  .account__list div {
    grid-template-columns: 10rem 1fr;
    align-items: center;
  }
}
</style>
