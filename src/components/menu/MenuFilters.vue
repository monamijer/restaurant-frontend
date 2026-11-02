<template>
  <section class="filters" :aria-label="$t('menu.search')">
    <div class="filters__top">
      <BaseInput
        v-model="searchText"
        class="filters__search"
        type="search"
        name="q"
        autocomplete="off"
        :label="$t('menu.search')"
        :placeholder="$t('menu.searchPlaceholder')"
        :maxlength="100"
      />

      <div class="filters__sort">
        <label class="filters__label" for="menu-sort">{{ $t('menu.sortBy') }}</label>
        <select id="menu-sort" class="filters__select" :value="filters.ordering" @change="onOrdering">
          <option v-for="option in orderings" :key="option.value" :value="option.value">
            {{ $t(option.labelKey) }}
          </option>
        </select>
      </div>
    </div>

    <div class="filters__chips" role="group" :aria-label="$t('menu.categories')">
      <button
        type="button"
        class="chip"
        :class="{ 'chip--active': !filters.category }"
        :aria-pressed="!filters.category ? 'true' : 'false'"
        @click="$emit('change', { category: '' })"
      >
        {{ $t('menu.allCategories') }}
      </button>
      <button
        v-for="category in categories"
        :key="category.id"
        type="button"
        class="chip"
        :class="{ 'chip--active': filters.category === category.slug }"
        :aria-pressed="filters.category === category.slug ? 'true' : 'false'"
        @click="$emit('change', { category: category.slug })"
      >
        {{ category.name }}
      </button>
    </div>

    <div class="filters__bottom">
      <label class="filters__check">
        <input type="checkbox" :checked="filters.availableOnly" @change="onAvailability" />
        <span>{{ $t('menu.availableOnly') }}</span>
      </label>
      <BaseButton v-if="active" variant="ghost" size="sm" @click="$emit('reset')">
        {{ $t('menu.clearFilters') }}
      </BaseButton>
    </div>
  </section>
</template>

<script>
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import { hasActiveFilters, ORDERING_OPTIONS } from '@/utils/menuQuery'

const SEARCH_DELAY_MS = 350

export default {
  name: 'MenuFilters',
  components: { BaseButton, BaseInput },
  props: {
    filters: { type: Object, required: true },
    categories: { type: Array, default: () => [] },
  },
  emits: ['change', 'reset'],
  data() {
    return {
      searchText: this.filters.search,
      orderings: ORDERING_OPTIONS,
      timer: null,
    }
  },
  computed: {
    active() {
      return hasActiveFilters(this.filters)
    },
  },
  watch: {
    // Typing waits for a pause before searching, so the server is not asked per keystroke.
    searchText(text) {
      clearTimeout(this.timer)
      if (text.trim() === this.filters.search) return
      this.timer = setTimeout(() => this.$emit('change', { search: text.trim() }), SEARCH_DELAY_MS)
    },
    // The address changed from outside (clear filters, back button): follow it.
    'filters.search'(search) {
      if (search !== this.searchText.trim()) this.searchText = search
    },
  },
  beforeUnmount() {
    clearTimeout(this.timer)
  },
  methods: {
    onOrdering(event) {
      this.$emit('change', { ordering: event.target.value })
    },
    onAvailability(event) {
      this.$emit('change', { availableOnly: event.target.checked })
    },
  },
}
</script>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.filters__top {
  display: grid;
  gap: var(--space-4);
}

.filters__sort {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.filters__label {
  font-size: var(--text-sm);
  font-weight: 600;
}

.filters__select {
  min-height: var(--target-size);
  padding: 0 var(--space-4);
  font-size: 1rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
}

.filters__chips {
  display: flex;
  gap: var(--space-2);
  padding-bottom: var(--space-2);
  overflow-x: auto; /* One scrollable row on a phone instead of a tall wall of buttons. */
}

.chip {
  flex: none;
  min-height: var(--target-size);
  padding: 0 var(--space-4);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-pill);
  cursor: pointer;
}

.chip--active {
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
}

@media (hover: hover) {
  .chip:not(.chip--active):hover {
    background: var(--color-surface-sunken);
  }
}

.filters__bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.filters__check {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--target-size);
  cursor: pointer;
}

.filters__check input {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--color-primary);
}

@media (min-width: 40em) {
  .filters__top {
    grid-template-columns: 1fr 14rem;
    align-items: end;
  }
}
</style>
