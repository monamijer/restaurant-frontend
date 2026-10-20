<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="isDark ? $t('theme.switchToLight') : $t('theme.switchToDark')"
    @click="toggleTheme"
  >
    <svg v-if="isDark" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
      </g>
    </svg>
    <svg v-else viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" fill="currentColor" />
    </svg>
  </button>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useUiStore } from '@/store/ui'

export default {
  name: 'ThemeToggle',
  computed: {
    ...mapState(useUiStore, ['isDark']),
  },
  methods: {
    ...mapActions(useUiStore, ['toggleTheme']),
  },
}
</script>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--target-size);
  height: var(--target-size);
  color: var(--color-text);
  background: transparent;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

@media (hover: hover) {
  .theme-toggle:hover {
    background: var(--color-surface-sunken);
  }
}
</style>
