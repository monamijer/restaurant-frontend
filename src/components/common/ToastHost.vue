<template>
  <div class="toasts">
    <transition-group name="toast" tag="ol" class="toasts__list">
      <li
        v-for="toast in items"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.type}`"
        :role="toast.type === 'error' ? 'alert' : 'status'"
      >
        <p class="toast__message">{{ toast.message }}</p>
        <button
          type="button"
          class="toast__close"
          :aria-label="$t('common.dismiss')"
          @click="dismiss(toast.id)"
        >
          <span aria-hidden="true">×</span>
        </button>
      </li>
    </transition-group>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useToastStore } from '@/store/toasts'

export default {
  name: 'ToastHost',
  computed: {
    ...mapState(useToastStore, ['items']),
  },
  methods: {
    ...mapActions(useToastStore, ['dismiss']),
  },
}
</script>

<style scoped>
.toasts {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: var(--z-toast);
  padding: var(--space-4);
  padding-bottom: max(var(--space-4), env(safe-area-inset-bottom));
  pointer-events: none; /* Only the toasts themselves catch clicks. */
}

.toasts__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 28rem;
  margin-inline: auto;
  padding: 0;
  list-style: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  pointer-events: auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-inline-start-width: 4px;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
}

.toast--success {
  border-inline-start-color: var(--color-success);
}

.toast--error {
  border-inline-start-color: var(--color-danger);
}

.toast--info {
  border-inline-start-color: var(--color-info);
}

.toast__message {
  flex: 1;
  padding-block: var(--space-2);
  font-size: var(--text-sm);
}

.toast__close {
  flex: none;
  width: var(--target-size);
  height: var(--target-size);
  margin: calc(-1 * var(--space-2)) calc(-1 * var(--space-3)) calc(-1 * var(--space-2)) 0;
  font-size: 1.5rem;
  line-height: 1;
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.75rem);
}
</style>
