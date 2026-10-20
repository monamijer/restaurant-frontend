<template>
  <component
    :is="tag"
    v-bind="bindings"
    class="btn"
    :class="classes"
    :aria-busy="loading ? 'true' : null"
  >
    <BaseSpinner v-if="loading" small decorative />
    <slot />
  </component>
</template>

<script>
import BaseSpinner from './BaseSpinner.vue'

export default {
  name: 'BaseButton',
  components: { BaseSpinner },
  props: {
    variant: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'secondary', 'ghost', 'danger'].includes(value),
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg'].includes(value),
    },
    type: { type: String, default: 'button' },
    // When set, the button is a router link: navigation is a link, an action is a button.
    to: { type: [String, Object], default: null },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    block: { type: Boolean, default: false },
  },
  computed: {
    tag() {
      return this.to ? 'router-link' : 'button'
    },
    bindings() {
      if (this.to) return { to: this.to }
      return { type: this.type, disabled: this.disabled || this.loading }
    },
    classes() {
      return [`btn--${this.variant}`, `btn--${this.size}`, { 'btn--block': this.block }]
    },
  },
}
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--target-size);
  padding: 0 var(--space-5);
  font-weight: 600;
  font-size: var(--text-base);
  line-height: 1;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.btn:active:not(:disabled) {
  transform: translateY(1px);
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn--sm {
  min-height: 2.25rem;
  padding: 0 var(--space-4);
  font-size: var(--text-sm);
}

.btn--lg {
  min-height: 3.25rem;
  padding: 0 var(--space-6);
  font-size: var(--text-lg);
}

.btn--block {
  display: flex;
  width: 100%;
}

.btn--primary {
  color: var(--color-on-primary);
  background: var(--color-primary);
}

.btn--secondary {
  color: var(--color-text);
  background: transparent;
  border-color: var(--color-border-strong);
}

.btn--ghost {
  color: var(--color-text);
  background: transparent;
}

.btn--danger {
  color: var(--color-bg);
  background: var(--color-danger);
}

@media (hover: hover) {
  .btn--primary:hover:not(:disabled) {
    color: var(--color-on-primary);
    background: var(--color-primary-hover);
  }

  .btn--secondary:hover:not(:disabled),
  .btn--ghost:hover:not(:disabled) {
    background: var(--color-surface-sunken);
  }

  .btn--danger:hover:not(:disabled) {
    color: var(--color-bg);
    filter: brightness(1.08);
  }
}
</style>
