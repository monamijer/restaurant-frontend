<template>
  <div class="staff-order-new container">
    <StaffNav />

    <header>
      <h1>{{ $t('staff.newOrder.title') }}</h1>
      <p class="muted">{{ $t('staff.newOrder.subtitle') }}</p>
    </header>

    <EmptyState v-if="menuFailed" :title="$t('staff.newOrder.failed')">
      <BaseButton variant="secondary" @click="loadMenu">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <p v-else-if="menuLoading && menuItems.length === 0" class="muted" role="status">
      {{ $t('staff.newOrder.loading') }}
    </p>

    <form v-else class="grid" @submit.prevent="submit">
      <section class="panel">
        <h2>{{ $t('staff.newOrder.cartTitle') }}</h2>

        <FormAlert v-if="formError" :message="formError" />

        <label class="field">
          <span>{{ $t('staff.newOrder.fields.orderType') }}</span>
          <select v-model="orderType" class="control" :class="{ 'has-error': errors.orderType }">
            <option v-for="t in types" :key="t" :value="t">{{ $t(`staff.newOrder.types.${t}`) }}</option>
          </select>
          <span v-if="errors.orderType" class="error">{{ errors.orderType }}</span>
        </label>

        <label v-if="orderType === 'dine_in'" class="field">
          <span>{{ $t('staff.newOrder.fields.table') }}</span>
          <select v-model.number="tableId" class="control" :class="{ 'has-error': errors.table }">
            <option :value="null">{{ $t('staff.newOrder.fields.tablePlaceholder') }}</option>
            <option v-for="t in tables" :key="t.id" :value="t.id">
              {{ t.number }} · {{ t.location }}
            </option>
          </select>
          <span v-if="errors.table" class="error">{{ errors.table }}</span>
        </label>

        <label class="field">
          <span>{{ $t('staff.newOrder.fields.notes') }}</span>
          <textarea v-model="notes" class="control" rows="2" maxlength="255" />
        </label>

        <h3 class="subtitle">{{ $t('staff.newOrder.cartTitle') }}</h3>

        <p v-if="lines.length === 0" class="muted">{{ $t('staff.newOrder.cartEmpty') }}</p>

        <ul v-else class="lines">
          <li v-for="line in lines" :key="line.id" class="line">
            <div>
              <p class="line__name">{{ line.name }}</p>
              <p class="muted line__meta">{{ money(line.price) }} × {{ line.quantity }}</p>
            </div>
            <div class="line__actions">
              <QuantityStepper
                :model-value="line.quantity"
                :min="1"
                :max="50"
                @update:model-value="(q) => setQuantity(line.id, q)"
              />
              <BaseButton variant="ghost" size="sm" type="button" @click="removeLine(line.id)">
                {{ $t('staff.newOrder.remove') }}
              </BaseButton>
            </div>
          </li>
        </ul>

        <p v-if="errors.items" class="error">{{ errors.items }}</p>

        <BaseButton type="submit" :loading="submitting" :disabled="submitting">
          {{ $t('staff.newOrder.submit') }}
        </BaseButton>
      </section>

      <section class="panel">
        <h2>{{ $t('staff.newOrder.fields.search') }}</h2>
        <label class="field">
          <input
            v-model="search"
            type="search"
            class="control"
            :placeholder="$t('staff.newOrder.fields.search')"
          />
        </label>

        <ul class="menu">
          <li v-for="item in filteredItems" :key="item.id" class="menu-item">
            <div>
              <p class="menu-item__name">{{ item.name }}</p>
              <p class="muted menu-item__price">{{ money(item.price) }}</p>
            </div>
            <BaseButton size="sm" type="button" @click="addLine(item)">
              {{ $t('staff.newOrder.fields.addToOrder') }}
            </BaseButton>
          </li>
        </ul>
      </section>
    </form>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import BaseButton from '@/components/common/BaseButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import QuantityStepper from '@/components/cart/QuantityStepper.vue'
import StaffNav from '@/components/staff/StaffNav.vue'
import { CURRENCY } from '@/config'
import { menuService } from '@/services/menuService'
import staffOrderService from '@/services/staffOrderService'
import { staffTableService } from '@/services/staffTableService'
import { useUiStore } from '@/store/ui'
import { useToastStore } from '@/store/toasts'
import formErrors from '@/mixins/formErrors'
import { formatMoney } from '@/utils/format'

const TYPES = ['dine_in', 'takeaway', 'delivery']

export default {
  name: 'StaffOrderNewView',
  components: { BaseButton, EmptyState, FormAlert, QuantityStepper, StaffNav },
  mixins: [formErrors],
  data() {
    return {
      orderType: 'dine_in',
      tableId: null,
      notes: '',
      search: '',
      menuItems: [],
      tables: [],
      menuLoading: false,
      menuFailed: false,
      lines: [],
      nextLineId: 1,
      types: TYPES,
    }
  },
  computed: {
    ...mapState(useUiStore, ['locale']),
    filteredItems() {
      const q = this.search.trim().toLowerCase()
      return q ? this.menuItems.filter((i) => i.name.toLowerCase().includes(q)) : this.menuItems
    },
  },
  created() {
    this.loadMenu()
    this.loadTables()
  },
  methods: {
    money(amount) { return formatMoney(amount, CURRENCY, this.locale) },

    async loadMenu() {
      this.menuLoading = true
      this.menuFailed = false
      try {
        const page = await menuService.items({ is_available: true, page_size: 100 })
        this.menuItems = page.results
      } catch {
        this.menuFailed = true
      } finally {
        this.menuLoading = false
      }
    },

    async loadTables() {
      try {
        const page = await staffTableService.list({ page_size: 100 })
        this.tables = Array.isArray(page) ? page : (page.results ?? [])
      } catch {
        this.tables = []
      }
    },

    addLine(item) {
      const existing = this.lines.find((l) => l.menuItemId === item.id)
      if (existing) {
        existing.quantity = Math.min(50, existing.quantity + 1)
        return
      }
      this.lines.push({
        id: this.nextLineId++,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      })
    },

    setQuantity(lineId, quantity) {
      const line = this.lines.find((l) => l.id === lineId)
      if (line) line.quantity = Math.max(1, Math.min(50, quantity))
    },

    removeLine(lineId) {
      this.lines = this.lines.filter((l) => l.id !== lineId)
    },

    validate() {
      const next = {}
      if (!TYPES.includes(this.orderType)) next.orderType = this.$t('staff.newOrder.validation.orderType')
      if (this.orderType === 'dine_in' && !this.tableId) next.table = this.$t('staff.newOrder.validation.table')
      if (this.lines.length === 0) next.items = this.$t('staff.newOrder.validation.items')
      this.errors = next
      return Object.keys(next).length === 0
    },

    async submit() {
      if (this.submitting) return
      this.clearErrors()
      if (!this.validate()) return

      const payload = {
        order_type: this.orderType,
        notes: this.notes || undefined,
        items: this.lines.map((l) => ({ menu_item: l.menuItemId, quantity: l.quantity })),
      }
      if (this.orderType === 'dine_in') payload.table = this.tableId

      this.submitting = true
      try {
        const order = await staffOrderService.create(payload)
        useToastStore().success(this.$t('staff.newOrder.success'))
        this.$router.push({ name: 'staff-order', params: { id: order.id } })
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
.staff-order-new {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-6);
}

.grid {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
}

.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.panel h2 {
  font-size: var(--text-lg);
}

.subtitle {
  font-size: var(--text-base);
  margin-top: var(--space-2);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-sm);
}

.control {
  min-height: var(--target-size);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: inherit;
  font: inherit;
}

.control.has-error {
  border-color: var(--color-danger);
}

.error {
  color: var(--color-danger);
  font-size: var(--text-sm);
}

.lines,
.menu {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0;
  list-style: none;
}

.line,
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}

.line:last-child,
.menu-item:last-child {
  border-bottom: none;
}

.line__name,
.menu-item__name {
  font-weight: 600;
}

.line__meta,
.menu-item__price {
  font-size: var(--text-sm);
}

.line__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
</style>
