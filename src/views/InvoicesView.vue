<template>
  <div class="invoices container">
    <header>
      <h1>{{ $t('invoices.heading') }}</h1>
    </header>

    <EmptyState v-if="failed" :title="$t('invoices.errorTitle')" :description="$t('menu.errorText')">
      <BaseButton variant="secondary" @click="fetchInvoices">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <ul v-else-if="loading && invoices.length === 0" class="list" aria-hidden="true">
      <li v-for="n in 3" :key="n" class="row"><BaseSkeleton height="2.5rem" /></li>
    </ul>

    <EmptyState v-else-if="invoices.length === 0" :title="$t('invoices.emptyTitle')" :description="$t('invoices.emptyText')" />

    <ul v-else class="list">
      <li v-for="invoice in invoices" :key="invoice.id" class="row">
        <InvoiceCard :invoice="invoice" />
        <router-link class="row__order" :to="{ name: 'order', params: { id: invoice.order } }">
          {{ $t('invoices.order', { id: invoice.order }) }}
        </router-link>
      </li>
    </ul>

    <BasePagination :page="page" :total-pages="pages" @change="goToPage" />
  </div>
</template>

<script>
import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import InvoiceCard from '@/components/orders/InvoiceCard.vue'
import { invoiceService } from '@/services/invoiceService'

const PAGE_SIZE = 10

export default {
  name: 'InvoicesView',
  components: { BaseButton, BasePagination, BaseSkeleton, EmptyState, InvoiceCard },
  data() {
    return { invoices: [], count: 0, loading: false, failed: false, requestId: 0 }
  },
  computed: {
    page() {
      const page = Number.parseInt(this.$route.query.page, 10)
      return Number.isInteger(page) && page >= 1 ? page : 1
    },
    pages() {
      return Math.max(1, Math.ceil(this.count / PAGE_SIZE))
    },
  },
  watch: {
    '$route.fullPath'() {
      if (this.$route.name === 'invoices') this.fetchInvoices()
    },
  },
  created() {
    this.fetchInvoices()
  },
  methods: {
    async fetchInvoices() {
      const id = ++this.requestId
      this.loading = true
      this.failed = false
      try {
        const page = await invoiceService.list({ page: this.page, page_size: PAGE_SIZE })
        if (id !== this.requestId) return
        this.invoices = page.results
        this.count = page.count
      } catch {
        if (id === this.requestId) this.failed = true
      } finally {
        if (id === this.requestId) this.loading = false
      }
    },

    goToPage(page) {
      this.$router.push({ name: 'invoices', query: page > 1 ? { page: String(page) } : {} })
    },
  },
}
</script>

<style scoped>
.invoices {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-7) var(--space-6);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0;
  list-style: none;
}

.row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.row__order {
  align-self: flex-start;
  font-size: var(--text-sm);
}
</style>
