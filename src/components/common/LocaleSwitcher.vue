<template>
  <div class="locale" role="group" :aria-label="$t('locale.label')">
    <button
      v-for="code in locales"
      :key="code"
      type="button"
      class="locale__button"
      :class="{ 'locale__button--active': code === locale }"
      :lang="code"
      :aria-label="$t(`locale.${code}`)"
      :aria-pressed="code === locale ? 'true' : 'false'"
      @click="setLocale(code)"
    >
      {{ code.toUpperCase() }}
    </button>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { SUPPORTED_LOCALES } from '@/config'
import { useUiStore } from '@/store/ui'

export default {
  name: 'LocaleSwitcher',
  data() {
    return { locales: SUPPORTED_LOCALES }
  },
  computed: {
    ...mapState(useUiStore, ['locale']),
  },
  methods: {
    ...mapActions(useUiStore, ['setLocale']),
  },
}
</script>

<style scoped>
.locale {
  display: inline-flex;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.locale__button {
  min-width: var(--target-size);
  height: calc(var(--target-size) - 2px);
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.04em;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.locale__button + .locale__button {
  border-inline-start: 1px solid var(--color-border-strong);
}

.locale__button--active {
  color: var(--color-on-primary);
  background: var(--color-primary);
}

@media (hover: hover) {
  .locale__button:not(.locale__button--active):hover {
    background: var(--color-surface-sunken);
  }
}
</style>
