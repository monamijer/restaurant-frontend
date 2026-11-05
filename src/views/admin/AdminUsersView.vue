<template>
  <div class="admin-users container">
    <AdminNav />

    <header class="head">
      <div>
        <h1>{{ $t('admin.users.title') }}</h1>
        <p class="muted">{{ $t('admin.users.subtitle') }}</p>
      </div>
      <BaseButton :to="{ name: 'admin-user-new' }">{{ $t('admin.users.create') }}</BaseButton>
    </header>

    <form class="filters cluster" @submit.prevent="applyFilters">
      <label class="field">
        <span>{{ $t('admin.users.filters.role') }}</span>
        <select v-model="draft.role" class="control">
          <option value="">{{ $t('admin.users.filters.all') }}</option>
          <option value="client">{{ $t('admin.users.roles.client') }}</option>
          <option value="staff">{{ $t('admin.users.roles.staff') }}</option>
          <option value="admin">{{ $t('admin.users.roles.admin') }}</option>
        </select>
      </label>

      <label class="field">
        <span>{{ $t('admin.users.filters.search') }}</span>
        <input v-model="draft.search" type="search" class="control" />
      </label>

      <label class="field field--check">
        <input v-model="draft.activeOnly" type="checkbox" />
        <span>{{ $t('admin.users.filters.activeOnly') }}</span>
      </label>

      <BaseButton type="submit">{{ $t('admin.users.filters.apply') }}</BaseButton>
      <BaseButton type="button" variant="ghost" @click="clearFilters">
        {{ $t('admin.users.filters.clear') }}
      </BaseButton>
    </form>

    <FormAlert v-if="actionError" :message="actionError" />

    <EmptyState v-if="failed" :title="$t('admin.users.failed')">
      <BaseButton variant="secondary" @click="fetchList">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <ul v-else-if="loading && items.length === 0" class="list" aria-hidden="true">
      <li v-for="n in 4" :key="n"><BaseSkeleton height="3.5rem" /></li>
    </ul>

    <EmptyState v-else-if="items.length === 0" :title="$t('admin.users.empty')" />

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>{{ $t('admin.users.columns.name') }}</th>
            <th>{{ $t('admin.users.columns.email') }}</th>
            <th>{{ $t('admin.users.columns.role') }}</th>
            <th>{{ $t('admin.users.columns.status') }}</th>
            <th class="num">{{ $t('admin.users.columns.orders') }}</th>
            <th class="num">{{ $t('admin.users.columns.spent') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in items" :key="user.id">
            <td>{{ fullName(user) }}</td>
            <td>{{ user.email }}</td>
            <td>{{ $t(`admin.users.roles.${user.role}`) }}</td>
            <td>
              <BaseBadge :tone="user.is_active ? 'success' : 'neutral'">
                {{ user.is_active ? $t('admin.users.active') : $t('admin.users.inactive') }}
              </BaseBadge>
            </td>
            <td class="num">{{ user.orders_count }}</td>
            <td class="num">{{ money(user.total_spent) }}</td>
            <td>
              <BaseButton
                size="sm"
                variant="secondary"
                :to="{ name: 'admin-user-edit', params: { id: user.id } }"
              >
                {{ $t('admin.users.edit') }}
              </BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BasePagination :page="page" :total-pages="pages" @change="goToPage" />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import AdminNav from '@/components/admin/AdminNav.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import { CURRENCY } from '@/config'
import { adminUserService } from '@/services/adminUserService'
import { useUiStore } from '@/store/ui'
import { describeError } from '@/utils/errors'
import { formatMoney } from '@/utils/format'

const PAGE_SIZE = 20

export default {
  name: 'AdminUsersView',
  components: { AdminNav, BaseBadge, BaseButton, BasePagination, BaseSkeleton, EmptyState, FormAlert },
  data() {
    return {
      items: [],
      count: 0,
      loading: false,
      failed: false,
      actionError: '',
      requestId: 0,
      draft: {
        role: this.$route.query.role || '',
        search: this.$route.query.search || '',
        activeOnly: this.$route.query.active === '1',
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
      const q = { page: this.page, page_size: PAGE_SIZE, ordering: '-created_at' }
      if (this.$route.query.role) q.role = this.$route.query.role
      if (this.$route.query.search) q.search = this.$route.query.search
      if (this.$route.query.active === '1') q.is_active = true
      return q
    },
  },
  watch: {
    '$route.fullPath'() {
      if (this.$route.name === 'admin-users') {
        this.syncDraft()
        this.fetchList()
      }
    },
  },
  created() {
    this.fetchList()
  },
  methods: {
    money(amount) { return formatMoney(amount, CURRENCY, this.locale) },
    fullName(user) {
      const name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
      return name || user.email
    },

    syncDraft() {
      this.draft.role = this.$route.query.role || ''
      this.draft.search = this.$route.query.search || ''
      this.draft.activeOnly = this.$route.query.active === '1'
    },

    async fetchList() {
      const id = ++this.requestId
      this.loading = true
      this.failed = false
      try {
        const page = await adminUserService.list(this.query)
        if (id !== this.requestId) return
        this.items = page.results
        this.count = page.count
      } catch (error) {
        if (id === this.requestId) {
          this.failed = true
          this.actionError = describeError(error, this.$t.bind(this))
        }
      } finally {
        if (id === this.requestId) this.loading = false
      }
    },

    applyFilters() {
      const query = {}
      if (this.draft.role) query.role = this.draft.role
      if (this.draft.search.trim()) query.search = this.draft.search.trim()
      if (this.draft.activeOnly) query.active = '1'
      this.$router.push({ name: 'admin-users', query })
    },

    clearFilters() {
      this.draft.role = ''
      this.draft.search = ''
      this.draft.activeOnly = false
      this.$router.push({ name: 'admin-users', query: {} })
    },

    goToPage(p) {
      const query = { ...this.$route.query }
      if (p > 1) query.page = String(p)
      else delete query.page
      this.$router.push({ name: 'admin-users', query })
    },
  },
}
</script>

<style scoped>
.admin-users {
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

.field--check {
  flex-direction: row;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--target-size);
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

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.table th,
.table td {
  padding: var(--space-3);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.table tr:last-child td {
  border-bottom: none;
}

.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
