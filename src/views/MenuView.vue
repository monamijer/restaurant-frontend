<template>
  <div class="menu container">
    <header class="menu__header">
      <p class="eyebrow">{{ $t('menu.eyebrow') }}</p>
      <h1>{{ $t('menu.heading') }}</h1>
      <p class="muted menu__lead">{{ $t('menu.lead') }}</p>
    </header>

    <MenuFilters :filters="filters" :categories="categories" @change="onChange" @reset="reset" />

    <p class="menu__status" role="status">{{ statusText }}</p>

    <EmptyState v-if="failed" :title="$t('menu.errorTitle')" :description="$t('menu.errorText')">
      <BaseButton variant="secondary" @click="fetchItems">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <ul v-else-if="loading && items.length === 0" class="menu__grid" aria-hidden="true">
      <li v-for="n in 6" :key="n" class="menu__skeleton">
        <BaseSkeleton height="9rem" />
        <BaseSkeleton width="70%" height="1.25rem" />
        <BaseSkeleton width="40%" />
      </li>
    </ul>

    <EmptyState
      v-else-if="items.length === 0"
      :title="$t('menu.emptyTitle')"
      :description="$t('menu.emptyText')"
    >
      <BaseButton v-if="filtered" variant="secondary" @click="reset">{{ $t('menu.clearFilters') }}</BaseButton>
    </EmptyState>

    <ul v-else class="menu__grid" :class="{ 'menu__grid--busy': loading }" :aria-busy="loading ? 'true' : 'false'">
      <li v-for="item in items" :key="item.id">
        <MenuItemCard :item="item" />
      </li>
    </ul>

    <BasePagination :page="filters.page" :total-pages="pages" @change="goToPage" />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import MenuFilters from '@/components/menu/MenuFilters.vue'
import MenuItemCard from '@/components/menu/MenuItemCard.vue'
import { menuService } from '@/services/menuService'
import { useMenuStore } from '@/store/menu'
import { toApiError } from '@/utils/errors'
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  parseMenuQuery,
  toApiParams,
  toRouteQuery,
  totalPages,
} from '@/utils/menuQuery'

export default {
  name: 'MenuView',
  components: { BaseButton, BasePagination, BaseSkeleton, EmptyState, MenuFilters, MenuItemCard },
  data() {
    return {
      items: [],
      count: 0,
      loading: false,
      failed: false,
      requestId: 0, // Only the latest request may update the page.
    }
  },
  computed: {
    ...mapState(useMenuStore, ['categories']),
    filters() {
      return parseMenuQuery(this.$route.query)
    },
    filtered() {
      return hasActiveFilters(this.filters)
    },
    pages() {
      return totalPages(this.count)
    },
    statusText() {
      if (this.loading) return this.$t('menu.loadingResults')
      if (this.failed) return ''
      return this.$t('menu.results', { count: this.count }, this.count)
    },
  },
  watch: {
    // The address is the source of truth: every change of filters or page loads the list.
    '$route.fullPath'() {
      // During a page transition the route may already be another page: ignore it.
      if (this.$route.name === 'menu') this.fetchItems()
    },
  },
  created() {
    this.loadCategories()
    this.fetchItems()
  },
  methods: {
    ...mapActions(useMenuStore, ['loadCategories']),

    async fetchItems() {
      const id = ++this.requestId
      this.loading = true
      this.failed = false
      try {
        const page = await menuService.items(toApiParams(this.filters))
        if (id !== this.requestId) return
        this.items = page.results
        this.count = page.count
      } catch (error) {
        if (id !== this.requestId) return
        if (toApiError(error).status === 404 && this.filters.page > 1) {
          this.updateQuery({ page: 1 }, true) // A page that no longer exists: go back to the first.
          return
        }
        this.failed = true
      } finally {
        if (id === this.requestId) this.loading = false
      }
    },

    updateQuery(changes, replace = false) {
      const next = { ...this.filters, ...changes }
      if (!('page' in changes)) next.page = 1 // Any new filter starts again from the first page.
      this.$router[replace ? 'replace' : 'push']({ name: 'menu', query: toRouteQuery(next) })
    },

    onChange(changes) {
      // Typing a search replaces the entry, so the back button does not step through keystrokes.
      this.updateQuery(changes, 'search' in changes)
    },

    goToPage(page) {
      this.updateQuery({ page })
    },

    reset() {
      this.$router.push({
        name: 'menu',
        query: toRouteQuery({ ...EMPTY_FILTERS, ordering: this.filters.ordering }),
      })
    },
  },
}
</script>

<style scoped>
.menu {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-7) var(--space-6);
}

.menu__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.menu__lead {
  max-width: 36rem;
}

.menu__status {
  min-height: 1.5em;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.menu__grid {
  display: grid;
  gap: var(--space-4);
  padding: 0;
  list-style: none;
  transition: opacity var(--duration-base) var(--ease-out);
}

.menu__grid--busy {
  opacity: 0.55;
}

.menu__skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

@media (min-width: 36em) {
  .menu__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 64em) {
  .menu__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
