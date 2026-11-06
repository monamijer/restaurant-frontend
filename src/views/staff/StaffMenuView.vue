<template>
  <div class="staff-menu container">
    <StaffNav />

    <header class="head">
      <div>
        <h1>{{ $t('staff.menu.title') }}</h1>
        <p class="muted">{{ $t('staff.menu.subtitle') }}</p>
      </div>
    </header>

    <form class="filters cluster" @submit.prevent="applyFilters">
      <label class="field">
        <span>{{ $t('staff.menu.filters.category') }}</span>
        <select v-model="draft.category" class="control">
          <option value="">{{ $t('staff.menu.filters.all') }}</option>
          <option v-for="c in categories" :key="c.id" :value="c.slug">{{ c.name }}</option>
        </select>
      </label>

      <label class="field">
        <span>{{ $t('staff.menu.filters.search') }}</span>
        <input v-model="draft.q" type="search" class="control" maxlength="100" />
      </label>

      <BaseButton type="submit">{{ $t('staff.menu.filters.apply') }}</BaseButton>
      <BaseButton type="button" variant="ghost" @click="clearFilters">
        {{ $t('staff.menu.filters.clear') }}
      </BaseButton>
    </form>

    <FormAlert v-if="actionError" :message="actionError" />

    <EmptyState v-if="failed" :title="$t('staff.menu.failed')">
      <BaseButton variant="secondary" @click="fetchList">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <ul v-else-if="loading && items.length === 0" class="list" aria-hidden="true">
      <li v-for="n in 4" :key="n"><BaseSkeleton height="4rem" /></li>
    </ul>

    <EmptyState v-else-if="items.length === 0" :title="$t('staff.menu.empty')" />

    <ul v-else class="list">
      <li v-for="item in items" :key="item.id" class="card">
        <div class="card__main">
          <img v-if="item.image" :src="item.image" alt="" class="card__image" />
          <div>
            <p class="card__title">{{ item.name }}</p>
            <p class="muted card__meta">{{ item.category_name }} · {{ money(item.price) }}</p>
          </div>
        </div>

        <div class="card__end">
          <BaseBadge :tone="item.is_available ? 'success' : 'neutral'">
            {{ item.is_available ? $t('staff.menu.available') : $t('staff.menu.unavailable') }}
          </BaseBadge>
          <BaseButton
            size="sm"
            :variant="item.is_available ? 'secondary' : 'primary'"
            :loading="busyId === item.id"
            :disabled="busyId === item.id"
            @click="toggleAvailability(item)"
          >
            {{ item.is_available ? $t('staff.menu.disable') : $t('staff.menu.enable') }}
          </BaseButton>
        </div>
      </li>
    </ul>

    <BasePagination :page="page" :total-pages="pages" @change="goToPage" />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import StaffNav from '@/components/staff/StaffNav.vue'
import { CURRENCY } from '@/config'
import { adminMenuService } from '@/services/adminMenuService'
import { menuService } from '@/services/menuService'
import { useToastStore } from '@/store/toasts'
import { useUiStore } from '@/store/ui'
import { describeError } from '@/utils/errors'
import { formatMoney } from '@/utils/format'

const PAGE_SIZE = 20

export default {
  name: 'StaffMenuView',
  components: { BaseBadge, BaseButton, BasePagination, BaseSkeleton, EmptyState, FormAlert, StaffNav },
  data() {
    return {
      items: [],
      count: 0,
      categories: [],
      loading: false,
      failed: false,
      busyId: null,
      actionError: '',
      requestId: 0,
      draft: {
        category: this.$route.query.category || '',
        q: this.$route.query.q || '',
      },
    }
  },
  computed: {
    ...mapState(useUiStore, ['locale']),
    page() {
      const p = Number.parseInt(this.$route.query.page, 10)
      return Number.isInteger(p) && p >= 1 ? p : 1
    },
    pages() {
      return Math.max(1, Math.ceil(this.count / PAGE_SIZE))
    },
    query() {
      const q = { page: this.page, page_size: PAGE_SIZE }
      if (this.$route.query.category) q.category_slug = this.$route.query.category
      if (this.$route.query.q) q.search = this.$route.query.q
      return q
    },
  },
  watch: {
    '$route.fullPath'() {
      if (this.$route.name === 'staff-menu') {
        this.syncDraft()
        this.fetchList()
      }
    },
  },
  async created() {
    await this.loadCategories()
    this.fetchList()
  },
  methods: {
    money(amount) { return formatMoney(amount, CURRENCY, this.locale) },

    syncDraft() {
      this.draft.category = this.$route.query.category || ''
      this.draft.q = this.$route.query.q || ''
    },

    async loadCategories() {
      try {
        this.categories = await menuService.categories()
      } catch {
        this.categories = []
      }
    },

    async fetchList() {
      const id = ++this.requestId
      this.loading = true
      this.failed = false
      try {
        const page = await adminMenuService.list(this.query)
        if (id !== this.requestId) return
        this.items = page.results
        this.count = page.count
      } catch {
        if (id === this.requestId) this.failed = true
      } finally {
        if (id === this.requestId) this.loading = false
      }
    },

    applyFilters() {
      const query = {}
      if (this.draft.category) query.category = this.draft.category
      if (this.draft.q.trim()) query.q = this.draft.q.trim()
      this.$router.push({ name: 'staff-menu', query })
    },

    clearFilters() {
      this.draft.category = ''
      this.draft.q = ''
      this.$router.push({ name: 'staff-menu', query: {} })
    },

    goToPage(p) {
      const query = { ...this.$route.query }
      if (p > 1) query.page = String(p)
      else delete query.page
      this.$router.push({ name: 'staff-menu', query })
    },

    async toggleAvailability(item) {
      if (this.busyId) return
      this.busyId = item.id
      this.actionError = ''
      try {
        const updated = await adminMenuService.setAvailability(item.id, !item.is_available)
        const index = this.items.findIndex((i) => i.id === item.id)
        if (index !== -1) this.items.splice(index, 1, updated)
        useToastStore().success(this.$t('staff.menu.updated'))
      } catch (error) {
        this.actionError = describeError(error, this.$t.bind(this))
      } finally {
        this.busyId = null
      }
    },
  },
}
</script>

<style scoped>
.staff-menu {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-6);
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-3);
}

.filters {
  align-items: end;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-sm);
}

.control {
  min-height: var(--target-size);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: inherit;
  font: inherit;
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0;
  list-style: none;
}

.card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.card__main {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.card__image {
  width: 4rem;
  height: 4rem;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.card__title {
  font-weight: 700;
}

.card__meta {
  font-size: var(--text-sm);
}

.card__end {
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: var(--space-2);
}
</style>
