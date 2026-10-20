<template>
  <dialog
    ref="dialog"
    class="modal"
    :aria-labelledby="titleId"
    @close="$emit('close')"
    @cancel="onCancel"
    @click="onBackdropClick"
  >
    <div class="modal__panel">
      <header class="modal__header">
        <h2 :id="titleId" class="modal__title">{{ title }}</h2>
        <button
          v-if="closable"
          type="button"
          class="modal__close"
          :aria-label="$t('common.close')"
          @click="close"
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div class="modal__body">
        <slot />
      </div>

      <footer v-if="$slots.footer" class="modal__footer">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

<script>
let nextId = 0

// A native <dialog> opened with showModal(): the browser traps focus inside, makes the rest of
// the page inert, closes on Escape and returns focus to the element that opened it.
export default {
  name: 'BaseModal',
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, required: true },
    closable: { type: Boolean, default: true },
  },
  emits: ['close'],
  data() {
    return { titleId: `modal-title-${++nextId}` }
  },
  watch: {
    open(isOpen) {
      this.sync(isOpen)
    },
  },
  mounted() {
    this.sync(this.open)
  },
  methods: {
    sync(isOpen) {
      const dialog = this.$refs.dialog
      if (isOpen && !dialog.open) dialog.showModal()
      else if (!isOpen && dialog.open) dialog.close()
    },
    close() {
      this.$refs.dialog.close()
    },
    onCancel(event) {
      // Escape: a dialog that must be answered explicitly cannot be dismissed this way.
      if (!this.closable) event.preventDefault()
    },
    onBackdropClick(event) {
      // The panel fills the dialog, so a click that lands on the dialog itself is on the backdrop.
      if (this.closable && event.target === this.$refs.dialog) this.close()
    },
  },
}
</script>

<style scoped>
.modal {
  width: min(32rem, calc(100% - 2 * var(--space-4)));
  max-height: calc(100dvh - 2 * var(--space-4));
  margin: auto;
  padding: 0;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-overlay);
}

.modal::backdrop {
  background: var(--color-overlay);
}

.modal[open] {
  animation: modal-in var(--duration-base) var(--ease-out);
}

.modal__panel {
  display: flex;
  flex-direction: column;
  max-height: inherit;
}

.modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-5) var(--space-3);
}

.modal__title {
  font-size: var(--text-xl);
}

.modal__close {
  flex: none;
  width: var(--target-size);
  height: var(--target-size);
  margin: calc(-1 * var(--space-2));
  font-size: 1.75rem;
  line-height: 1;
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.modal__body {
  padding: 0 var(--space-5) var(--space-5);
  overflow-y: auto;
}

.modal__footer {
  display: flex;
  flex-direction: column-reverse;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5) var(--space-5);
  border-top: 1px solid var(--color-border);
}

@media (min-width: 40em) {
  .modal__footer {
    flex-direction: row;
    justify-content: flex-end;
  }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(0.5rem);
  }
}
</style>
