<template>
  <div class="staff-tables container">
    <StaffNav />

    <header class="head">
      <div>
        <h1>{{ $t('staff.tables.title') }}</h1>
        <p class="muted">{{ $t('staff.tables.subtitle') }}</p>
      </div>
      <p class="muted" role="status" aria-live="polite">
        {{ $t('staff.tables.countLabel', { count }) }}
      </p>
    </header>

    <div class="cluster">
      <BaseButton :loading="sheetLoading" :disabled="sheetLoading" @click="downloadSheet">
        {{ $t('staff.tables.sheet') }}
      </BaseButton>
      <BaseButton variant="ghost" type="button" @click="fetchList">
        {{ $t('staff.common.refresh') }}
      </BaseButton>
    </div>

    <form class="filters cluster" @submit.prevent="applyFilters">
      <label class="field">
        <span>{{ $t('staff.tables.filters.status') }}</span>
        <select v-model="draft.status" class="control">
          <option value="">{{ $t('staff.tables.filters.all') }}</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ $t(`staff.tables.status.${s}`) }}</option>
        </select>
      </label>

      <label class="field">
        <span>{{ $t('staff.tables.filters.location') }}</span>
        <input v-model="draft.location" type="text" class="control" />
      </label>

      <BaseButton type="submit">{{ $t('staff.tables.filters.apply') }}</BaseButton>
      <BaseButton type="button" variant="ghost" @click="clearFilters">
        {{ $t('staff.tables.filters.clear') }}
      </BaseButton>
    </form>

    <FormAlert v-if="actionError" :message="actionError" />

    <EmptyState v-if="failed" :title="$t('staff.tables.failed')">
      <BaseButton variant="secondary" @click="fetchList">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <ul v-else-if="loading && items.length === 0" class="list" aria-hidden="true">
      <li v-for="n in 4" :key="n"><BaseSkeleton height="4rem" /></li>
    </ul>

    <EmptyState v-else-if="items.length === 0" :title="$t('staff.tables.empty')" />

    <ul v-else class="list">
      <li v-for="table in items" :key="table.id" class="card">
        <div>
          <p class="card__title">{{ $t('staff.tables.tableNumber', { number: table.number }) }}</p>
          <p class="muted card__meta">
            {{ table.location }} · {{ $t('staff.tables.capacity', { count: table.capacity }) }}
          </p>
        </div>

        <div class="card__end">
          <label class="inline-field">
            <span class="visually-hidden">{{ $t('staff.tables.changeStatus') }}</span>
            <select
              class="control"
              :value="table.status"
              :disabled="busyId === table.id"
              @change="changeStatus(table, $event.target.value)"
            >
              <option v-for="s in statuses" :key="s" :value="s">{{ $t(`staff.tables.status.${s}`) }}</option>
            </select>
          </label>

          <div class="cluster actions">
            <BaseButton
              size="sm"
              variant="secondary"
              :loading="busyId === table.id && busyKind === 'qr'"
              :disabled="busyId === table.id"
              @click="downloadQr(table)"
            >
              {{ $t('staff.tables.qr') }}
            </BaseButton>
            <BaseButton
              size="sm"
              variant="danger"
              :disabled="busyId === table.id"
              @click="askRegenerate(table)"
            >
              {{ $t('staff.tables.regenerate') }}
            </BaseButton>
          </div>
        </div>
      </li>
    </ul>

    <BasePagination :page="page" :total-pages="pages" @change="goToPage" />

    <ConfirmDialog
      :open="dialog.open"
      danger
      :title="$t('staff.tables.regenerateTitle')"
      :message="$t('staff.tables.regenerateMessage', { number: dialog.table?.number })"
      :confirm-label="$t('staff.tables.regenerateConfirm')"
      :cancel-label="$t('common.cancel')"
      :loading="busyId === dialog.table?.id"
      @cancel="closeDialog"
      @confirm="regenerate"
    />
  </div>
</template>

<script>
import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import StaffNav from '@/components/staff/StaffNav.vue'
import { staffTableService } from '@/services/staffTableService'
import { useToastStore } from '@/store/toasts'
import { describeError } from '@/utils/errors'
import { saveBlob } from '@/utils/download'

const PAGE_SIZE = 20
const STATUSES = ['available', 'occupied', 'reserved', 'cleaning']

export default {
  name: 'StaffTablesView',
  components: { BaseButton, BasePagination, BaseSkeleton, ConfirmDialog, EmptyState, FormAlert, StaffNav },
  data() {
    return {
      items: [],
      count: 0,
      loading: false,
      failed: false,
      busyId: null,
      busyKind: null,
      sheetLoading: false,
      actionError: '',
      requestId: 0,
      statuses: STATUSES,
      draft: {
        status: this.$route.query.status || '',
        location: this.$route.query.location || '',
      },
      dialog: { open: false, table: null },
    }
  },
  computed: {
    page() {
      const p = Number.parseInt(this.$route.query.page, 10)
      return Number.isInteger(p) && p >= 1 ? p : 1
    },
    pages() {
      return Math.max(1, Math.ceil(this.count / PAGE_SIZE))
    },
    query() {
      const q = { page: this.page, page_size: PAGE_SIZE }
      if (this.$route.query.status) q.status = this.$route.query.status
      if (this.$route.query.location) q.location = this.$route.query.location
      return q
    },
  },
  watch: {
    '$route.fullPath'() {
      if (this.$route.name === 'staff-tables') {
        this.syncDraft()
        this.fetchList()
      }
    },
  },
  created() {
    this.fetchList()
  },
  methods: {
    syncDraft() {
      this.draft.status = this.$route.query.status || ''
      this.draft.location = this.$route.query.location || ''
    },

    async fetchList() {
      const id = ++this.requestId
      this.loading = true
      this.failed = false
      try {
        const page = await staffTableService.list(this.query)
        if (id !== this.requestId) return
        this.items = Array.isArray(page) ? page : page.results
        this.count = Array.isArray(page) ? page.length : page.count
      } catch {
        if (id === this.requestId) this.failed = true
      } finally {
        if (id === this.requestId) this.loading = false
      }
    },

    applyFilters() {
      const query = {}
      if (this.draft.status) query.status = this.draft.status
      if (this.draft.location) query.location = this.draft.location
      this.$router.push({ name: 'staff-tables', query })
    },

    clearFilters() {
      this.draft.status = ''
      this.draft.location = ''
      this.$router.push({ name: 'staff-tables', query: {} })
    },

    goToPage(p) {
      const query = { ...this.$route.query }
      if (p > 1) query.page = String(p)
      else delete query.page
      this.$router.push({ name: 'staff-tables', query })
    },

    async changeStatus(table, status) {
      if (this.busyId || status === table.status) return
      this.busyId = table.id
      this.busyKind = 'status'
      this.actionError = ''
      try {
        const updated = await staffTableService.setStatus(table.id, status)
        const index = this.items.findIndex((t) => t.id === table.id)
        if (index !== -1) this.items.splice(index, 1, updated)
        useToastStore().success(this.$t('staff.tables.updated'))
      } catch (error) {
        this.actionError = describeError(error, this.$t.bind(this))
      } finally {
        this.busyId = null
        this.busyKind = null
      }
    },

    async downloadQr(table) {
      if (this.busyId) return
      this.busyId = table.id
      this.busyKind = 'qr'
      this.actionError = ''
      try {
        const blob = await staffTableService.downloadQrCode(table.id)
        saveBlob(blob, `table-${table.number}-qr.png`)
      } catch (error) {
        this.actionError = describeError(error, this.$t.bind(this))
      } finally {
        this.busyId = null
        this.busyKind = null
      }
    },

    async downloadSheet() {
      if (this.sheetLoading) return
      this.sheetLoading = true
      this.actionError = ''
      try {
        const blob = await staffTableService.downloadQrSheet()
        saveBlob(blob, 'table-qr-sheet.pdf')
      } catch (error) {
        this.actionError = describeError(error, this.$t.bind(this))
      } finally {
        this.sheetLoading = false
      }
    },

    askRegenerate(table) {
      this.dialog = { open: true, table }
    },

    closeDialog() {
      this.dialog = { open: false, table: null }
    },

    async regenerate() {
      const table = this.dialog.table
      if (!table || this.busyId) return
      this.busyId = table.id
      this.busyKind = 'regenerate'
      this.actionError = ''
      try {
        await staffTableService.regenerateQr(table.id)
        useToastStore().success(this.$t('staff.tables.regenerated', { number: table.number }))
        this.closeDialog()
        await this.fetchList()
      } catch (error) {
        this.actionError = describeError(error, this.$t.bind(this))
      } finally {
        this.busyId = null
        this.busyKind = null
      }
    },
  },
}
</script>

<style scoped>
.staff-tables {
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

.inline-field {
  display: inline-flex;
  align-items: center;
}

.actions {
  flex-wrap: wrap;
  justify-content: end;
}
</style>
