<template>
  <div class="admin-settings container">
    <AdminNav />

    <header>
      <h1>{{ $t('admin.settings.title') }}</h1>
      <p class="muted">{{ $t('admin.settings.subtitle') }}</p>
    </header>

    <EmptyState v-if="failed" :title="$t('admin.settings.failed')">
      <BaseButton variant="secondary" @click="load">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <p v-else-if="loading" class="muted" role="status">{{ $t('admin.settings.loading') }}</p>

    <form v-else class="stack" novalidate @submit.prevent="submit">
      <FormAlert v-if="formError">{{ formError }}</FormAlert>

      <BaseInput
        v-model="draft.name"
        name="name"
        :label="$t('admin.settings.fields.name')"
        :error="errors.name"
        required
      />

      <div class="grid">
        <label class="field">
          <span class="field__label">{{ $t('admin.settings.fields.timezone') }}</span>
          <input v-model="draft.timezone" type="text" class="control" :class="{ 'control--invalid': errors.timezone }" />
          <p class="field__hint">{{ $t('admin.settings.fields.timezoneHint') }}</p>
          <p v-if="errors.timezone" class="field__error">{{ errors.timezone }}</p>
        </label>

        <label class="field">
          <span class="field__label">{{ $t('admin.settings.fields.taxRate') }}</span>
          <input v-model="draft.taxRate" type="number" step="0.01" min="0" max="100" class="control" :class="{ 'control--invalid': errors.taxRate }" />
          <p v-if="errors.taxRate" class="field__error">{{ errors.taxRate }}</p>
        </label>
      </div>

      <div class="grid">
        <label class="field">
          <span class="field__label">{{ $t('admin.settings.fields.openingTime') }}</span>
          <input v-model="draft.openingTime" type="time" class="control" :class="{ 'control--invalid': errors.openingTime }" />
          <p v-if="errors.openingTime" class="field__error">{{ errors.openingTime }}</p>
        </label>

        <label class="field">
          <span class="field__label">{{ $t('admin.settings.fields.closingTime') }}</span>
          <input v-model="draft.closingTime" type="time" class="control" :class="{ 'control--invalid': errors.closingTime }" />
          <p v-if="errors.closingTime" class="field__error">{{ errors.closingTime }}</p>
        </label>
      </div>

      <div class="grid">
        <label class="field">
          <span class="field__label">{{ $t('admin.settings.fields.slotStep') }}</span>
          <input v-model.number="draft.slotStep" type="number" min="1" class="control" />
        </label>

        <label class="field">
          <span class="field__label">{{ $t('admin.settings.fields.pendingExpiry') }}</span>
          <input v-model.number="draft.pendingExpiry" type="number" min="1" class="control" />
        </label>
      </div>

      <div class="grid">
        <label class="field">
          <span class="field__label">{{ $t('admin.settings.fields.minReservation') }}</span>
          <input v-model.number="draft.minReservation" type="number" min="1" class="control" :class="{ 'control--invalid': errors.minReservation }" />
          <p v-if="errors.minReservation" class="field__error">{{ errors.minReservation }}</p>
        </label>

        <label class="field">
          <span class="field__label">{{ $t('admin.settings.fields.maxReservation') }}</span>
          <input v-model.number="draft.maxReservation" type="number" min="1" class="control" :class="{ 'control--invalid': errors.maxReservation }" />
          <p v-if="errors.maxReservation" class="field__error">{{ errors.maxReservation }}</p>
        </label>
      </div>

      <label class="field">
        <span class="field__label">{{ $t('admin.settings.fields.queueMinutes') }}</span>
        <input v-model.number="draft.queueMinutes" type="number" min="1" class="control" />
      </label>

      <div class="cluster">
        <BaseButton type="submit" :loading="submitting" :disabled="submitting">
          {{ $t('common.confirm') }}
        </BaseButton>
        <BaseButton type="button" variant="ghost" @click="load">
          {{ $t('common.cancel') }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<script>
import AdminNav from '@/components/admin/AdminNav.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import formErrors from '@/mixins/formErrors'
import { settingsService } from '@/services/settingsService'
import { useRestaurantStore } from '@/store/restaurant'
import { useToastStore } from '@/store/toasts'

const EMPTY = {
  name: '',
  timezone: 'UTC',
  openingTime: '09:00',
  closingTime: '22:00',
  slotStep: 30,
  minReservation: 30,
  maxReservation: 180,
  pendingExpiry: 30,
  taxRate: '0.00',
  queueMinutes: 10,
}

export default {
  name: 'AdminSettingsView',
  components: { AdminNav, BaseButton, BaseInput, EmptyState, FormAlert },
  mixins: [formErrors],
  data() {
    return {
      draft: { ...EMPTY },
      loading: false,
      failed: false,
    }
  },
  created() {
    this.load()
  },
  methods: {
    toDraft(settings) {
      return {
        name: settings.name || '',
        timezone: settings.timezone || 'UTC',
        openingTime: this.hhmm(settings.opening_time),
        closingTime: this.hhmm(settings.closing_time),
        slotStep: settings.slot_step_minutes ?? 30,
        minReservation: settings.min_reservation_minutes ?? 30,
        maxReservation: settings.max_reservation_minutes ?? 180,
        pendingExpiry: settings.pending_reservation_expiry_minutes ?? 30,
        taxRate: settings.tax_rate ?? '0.00',
        queueMinutes: settings.queue_minutes_per_party ?? 10,
      }
    },

    hhmm(value) {
      return value ? String(value).slice(0, 5) : ''
    },

    async load() {
      this.loading = true
      this.failed = false
      try {
        const settings = await settingsService.get()
        this.draft = this.toDraft(settings)
      } catch {
        this.failed = true
      } finally {
        this.loading = false
      }
    },

    validate() {
      const next = {}
      if (!this.draft.name.trim()) next.name = this.$t('admin.settings.validation.name')
      if (!this.draft.timezone.trim()) next.timezone = this.$t('admin.settings.validation.timezone')
      const tax = Number(this.draft.taxRate)
      if (Number.isNaN(tax) || tax < 0 || tax > 100) {
        next.taxRate = this.$t('admin.settings.validation.taxRate')
      }
      if (this.draft.openingTime && this.draft.closingTime && this.draft.openingTime >= this.draft.closingTime) {
        next.closingTime = this.$t('admin.settings.validation.closingAfterOpening')
      }
      if (Number(this.draft.minReservation) > Number(this.draft.maxReservation)) {
        next.maxReservation = this.$t('admin.settings.validation.reservationBounds')
      }
      this.errors = next
      return Object.keys(next).length === 0
    },

    async submit() {
      if (this.submitting) return
      this.clearErrors()
      if (!this.validate()) return

      const payload = {
        name: this.draft.name.trim(),
        timezone: this.draft.timezone.trim(),
        opening_time: this.draft.openingTime,
        closing_time: this.draft.closingTime,
        slot_step_minutes: Number(this.draft.slotStep),
        min_reservation_minutes: Number(this.draft.minReservation),
        max_reservation_minutes: Number(this.draft.maxReservation),
        pending_reservation_expiry_minutes: Number(this.draft.pendingExpiry),
        tax_rate: String(this.draft.taxRate),
        queue_minutes_per_party: Number(this.draft.queueMinutes),
      }

      this.submitting = true
      try {
        await settingsService.update(payload)
        useToastStore().success(this.$t('admin.settings.saved'))
        await useRestaurantStore().load()
      } catch (error) {
        this.showApiError(error)
      } finally {
        this.submitting = false
      }
    },
  },
}
</script>

<style scoped>
.admin-settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-6);
  max-width: 42rem;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-sm);
}

.field__label {
  font-size: var(--text-sm);
  font-weight: 600;
}

.field__hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.field__error {
  color: var(--color-danger);
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

.control--invalid {
  border-color: var(--color-danger);
}
</style>
