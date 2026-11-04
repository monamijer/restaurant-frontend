<template>
  <router-link class="bell" :to="{ name: 'notifications' }" :aria-label="label">
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6v-5a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1z"
        fill="currentColor"
      />
    </svg>
    <span v-if="unread > 0" class="bell__count" aria-hidden="true">{{ unread > 99 ? '99+' : unread }}</span>
  </router-link>
</template>

<script>
import { mapState } from 'pinia'
import { useNotificationStore } from '@/store/notifications'

export default {
  name: 'NotificationBell',
  computed: {
    ...mapState(useNotificationStore, ['unread']),
    label() {
      return this.unread > 0
        ? this.$t('notifications.bellLabel', { count: this.unread }, this.unread)
        : this.$t('notifications.bellNone')
    },
  },
}
</script>

<style scoped>
.bell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--target-size);
  height: var(--target-size);
  color: var(--color-text);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
}

@media (hover: hover) {
  .bell:hover {
    background: var(--color-surface-sunken);
  }
}

.bell__count {
  position: absolute;
  top: -0.5rem;
  inset-inline-end: -0.5rem;
  min-width: 1.35rem;
  padding: 0 0.3rem;
  font-size: var(--text-xs);
  font-weight: 700;
  line-height: 1.35rem;
  text-align: center;
  color: var(--color-bg);
  background: var(--color-danger);
  border-radius: var(--radius-pill);
}
</style>
