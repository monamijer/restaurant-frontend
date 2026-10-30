<template>
  <footer class="footer">
    <div class="footer__inner container">
      <div>
        <p class="footer__name">{{ name }}</p>
        <p class="footer__rights muted">&copy; {{ year }} {{ name }}. {{ $t('footer.rights') }}</p>
      </div>
      <div>
        <h2 class="footer__title">{{ $t('footer.hours') }}</h2>
        <p v-if="hasHours" class="muted">{{ $t('footer.hoursValue', { open: opensAt, close: closesAt }) }}</p>
        <p v-else class="muted">{{ $t('footer.hoursUnknown') }}</p>
      </div>
    </div>
  </footer>
</template>

<script>
import { mapState } from 'pinia'
import { useRestaurantStore } from '@/store/restaurant'

export default {
  name: 'AppFooter',
  computed: {
    ...mapState(useRestaurantStore, ['name', 'opensAt', 'closesAt', 'hasHours']),
    year() {
      return new Date().getFullYear()
    },
  },
}
</script>

<style scoped>
.footer {
  margin-top: var(--space-8);
  padding-block: var(--space-6);
  background: var(--color-surface-sunken);
  border-top: 1px solid var(--color-border);
}

.footer__inner {
  display: grid;
  gap: var(--space-5);
}

.footer__name {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
}

.footer__title {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.footer__rights {
  font-size: var(--text-sm);
}

@media (min-width: 40em) {
  .footer__inner {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
