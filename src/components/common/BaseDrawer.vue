<template>
  <Teleport to="body">
    <div v-if="open" class="drawer" role="presentation">
      <div class="drawer__backdrop" aria-hidden="true" @click="requestClose" />
      <aside
        ref="panel"
        class="drawer__panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <header class="drawer__header">
          <h2 :id="titleId" class="drawer__title">{{ title }}</h2>
          <button
            type="button"
            class="drawer__close"
            :aria-label="$t('common.close')"
            @click="requestClose"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div class="drawer__body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="drawer__footer">
          <slot name="footer" />
        </footer>
      </aside>
    </div>
  </Teleport>
</template>

<script>
let nextId = 0

// A side panel that keeps focus inside while open, closes on Escape or a click on the backdrop,
// and returns focus to whatever opened it. Mounted through <Teleport> so it is not clipped by the
// header stacking context.
export default {
  name: 'BaseDrawer',
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, required: true },
  },
  emits: ['close'],
  data() {
    return { titleId: `drawer-title-${++nextId}` }
  },
  watch: {
    open(isOpen) {
      if (isOpen) this.onOpen()
      else this.onClose()
    },
  },
  beforeUnmount() {
    this.removeGlobalListeners()
    this.restoreFocus()
  },
  methods: {
    onOpen() {
      this.previouslyFocused = document.activeElement
      this.$nextTick(() => {
        this.$refs.panel?.focus?.()
        this.addGlobalListeners()
      })
    },
    onClose() {
      this.removeGlobalListeners()
      this.restoreFocus()
    },
    requestClose() {
      this.$emit('close')
    },
    onKeydown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        this.requestClose()
        return
      }
      if (event.key === 'Tab' && this.$refs.panel) {
        const focusables = this.$refs.panel.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    },
    addGlobalListeners() {
      document.addEventListener('keydown', this.onKeydown)
      document.documentElement.classList.add('no-scroll')
    },
    removeGlobalListeners() {
      document.removeEventListener('keydown', this.onKeydown)
      document.documentElement.classList.remove('no-scroll')
    },
    restoreFocus() {
      if (this.previouslyFocused && typeof this.previouslyFocused.focus === 'function') {
        this.previouslyFocused.focus()
      }
      this.previouslyFocused = null
    },
  },
}
</script>

<style scoped>
.drawer {
  position: fixed;
  inset: 0;
  z-index: var(--z-drawer);
}

.drawer__backdrop {
  position: absolute;
  inset: 0;
  background: var(--color-overlay);
  animation: drawer-fade var(--duration-base) var(--ease-out);
}

.drawer__panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: min(22rem, 90vw);
  background: var(--color-surface);
  box-shadow: var(--shadow-overlay);
  animation: drawer-slide var(--duration-base) var(--ease-out);
  outline: none;
}

.drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.drawer__title {
  font-size: var(--text-lg);
  font-weight: 600;
}

.drawer__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--target-size);
  height: var(--target-size);
  margin: calc(-1 * var(--space-2));
  font-size: 1.5rem;
  line-height: 1;
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-5);
}

.drawer__footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
}

@keyframes drawer-slide {
  from {
    transform: translateX(100%);
  }
}

@keyframes drawer-fade {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .drawer__panel,
  .drawer__backdrop {
    animation: none;
  }
}
</style>
