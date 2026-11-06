<template>
  <div class="table-form container">
    <AdminNav />

    <header>
      <h1>{{ isEdit ? $t('staff.tables.form.editTitle') : $t('staff.tables.form.newTitle') }}</h1>
      <p class="muted">{{ $t('staff.tables.form.subtitle') }}</p>
    </header>

    <p v-if="loading" class="muted" role="status">{{ $t('common.loading') }}</p>

    <EmptyState v-else-if="failed" :title="$t('staff.tables.form.loadFailed')">
      <BaseButton variant="secondary" @click="load">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <form v-else class="stack" novalidate @submit.prevent="submit">
      <FormAlert v-if="formError" :message="formError" />

      <BaseInput
        v-model="draft.number"
        name="number"
        type="number"
        inputmode="numeric"
        :label="$t('staff.tables.form.fields.number')"
        :error="errors.number"
        required
      />
      <BaseInput
        v-model="draft.capacity"
        name="capacity"
        type="number"
        inputmode="numeric"
        :label="$t('staff.tables.form.fields.capacity')"
        :error="errors.capacity"
        required
      />
      <BaseInput
        v-model="draft.location"
        name="location"
        :label="$t('staff.tables.form.fields.location')"
        :error="errors.location"
        show-optional
      />

      <div class="cluster">
        <BaseButton type="submit" :loading="submitting" :disabled="submitting">
          {{ $t('common.confirm') }}
        </BaseButton>
        <BaseButton type="button" variant="ghost" @click="$router.push({ name: 'staff-tables' })">
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
import { staffTableService } from '@/services/staffTableService'
import { useToastStore } from '@/store/toasts'

const MAX_CAPACITY = 50

export default {
  name: 'AdminTableFormView',
  components: { AdminNav, BaseButton, BaseInput, EmptyState, FormAlert },
  mixins: [formErrors],
  data() {
    return {
      draft: { number: '', capacity: '', location: '' },
      loading: false,
      failed: false,
    }
  },
  computed: {
    tableId() {
      return this.$route.params.id ? Number(this.$route.params.id) : null
    },
    isEdit() {
      return this.tableId !== null
    },
  },
  created() {
    if (this.isEdit) this.load()
  },
  methods: {
    async load() {
      this.loading = true
      this.failed = false
      try {
        const table = await staffTableService.get(this.tableId)
        this.draft = {
          number: String(table.number),
          capacity: String(table.capacity),
          location: table.location || '',
        }
      } catch {
        this.failed = true
      } finally {
        this.loading = false
      }
    },

    validate() {
      const next = {}
      const number = Number(this.draft.number)
      const capacity = Number(this.draft.capacity)
      if (!Number.isInteger(number) || number < 1) next.number = this.$t('staff.tables.form.validation.number')
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > MAX_CAPACITY) {
        next.capacity = this.$t('staff.tables.form.validation.capacity', { max: MAX_CAPACITY })
      }
      this.errors = next
      return Object.keys(next).length === 0
    },

    async submit() {
      if (this.submitting) return
      this.clearErrors()
      if (!this.validate()) return

      const payload = {
        number: Number(this.draft.number),
        capacity: Number(this.draft.capacity),
        location: this.draft.location.trim(),
      }

      this.submitting = true
      try {
        if (this.isEdit) await staffTableService.update(this.tableId, payload)
        else await staffTableService.create(payload)
        useToastStore().success(this.$t(this.isEdit ? 'staff.tables.form.saved' : 'staff.tables.form.created'))
        this.$router.push({ name: 'staff-tables' })
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
.table-form {
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
</style>
