<template>
  <div class="invoice">
    <div>
      <p class="invoice__number">{{ $t('invoices.number', { number: invoice.invoice_number }) }}</p>
      <p class="muted invoice__meta">{{ $t('invoices.issued', { date: issued }) }} · {{ total }}</p>
    </div>
    <BaseButton
      variant="secondary"
      size="sm"
      :loading="working"
      :aria-label="$t('invoices.downloadLabel', { number: invoice.invoice_number })"
      @click="download"
    >
      {{ $t('invoices.download') }}
    </BaseButton>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import BaseButton from '@/components/common/BaseButton.vue'
import { CURRENCY } from '@/config'
import { invoiceService } from '@/services/invoiceService'
import { useToastStore } from '@/store/toasts'
import { useUiStore } from '@/store/ui'
import { saveBlob } from '@/utils/download'
import { formatDateTime, formatMoney } from '@/utils/format'

export default {
  name: 'InvoiceCard',
  components: { BaseButton },
  props: {
    invoice: { type: Object, required: true },
  },
  data() {
    return { working: false }
  },
  computed: {
    ...mapState(useUiStore, ['locale']),
    issued() {
      return formatDateTime(this.invoice.issued_at, this.locale)
    },
    total() {
      return formatMoney(this.invoice.total, CURRENCY, this.locale)
    },
  },
  methods: {
    ...mapActions(useToastStore, ['error']),

    async download() {
      if (this.working) return
      this.working = true
      try {
        const blob = await invoiceService.downloadPdf(this.invoice.id)
        saveBlob(blob, `${this.invoice.invoice_number.replace(/[^\w.-]/g, '_')}.pdf`)
      } catch {
        this.error(this.$t('invoices.downloadFailed'))
      } finally {
        this.working = false
      }
    },
  },
}
</script>

<style scoped>
.invoice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.invoice__number {
  font-weight: 700;
}

.invoice__meta {
  font-size: var(--text-sm);
}
</style>
