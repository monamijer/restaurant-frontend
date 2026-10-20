<template>
  <span class="badge" :class="`badge--${tone}`"><slot /></span>
</template>

<script>
export default {
  name: 'BaseBadge',
  props: {
    tone: {
      type: String,
      default: 'neutral',
      validator: (value) => ['neutral', 'success', 'warning', 'danger', 'info'].includes(value),
    },
  },
}
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem var(--space-3);
  font-size: var(--text-xs);
  font-weight: 600;
  line-height: 1.5;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}

.badge--neutral {
  color: var(--color-text);
  background: var(--color-surface-sunken);
}

.badge--success {
  color: var(--color-success);
  background: var(--color-success-surface);
}

.badge--warning {
  color: var(--color-warning);
  background: var(--color-warning-surface);
}

.badge--danger {
  color: var(--color-danger);
  background: var(--color-danger-surface);
}

.badge--info {
  color: var(--color-info);
  background: var(--color-info-surface);
}
</style>
