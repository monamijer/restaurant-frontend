<template>
  <form class="stack" novalidate @submit.prevent="submit">
    <FormAlert v-if="formError">{{ formError }}</FormAlert>

    <BaseInput
      v-model="draft.name"
      name="name"
      :label="$t('admin.menu.form.name')"
      :error="errors.name"
      required
    />
    <BaseInput
      v-model="draft.description"
      name="description"
      :label="$t('admin.menu.form.description')"
      :error="errors.description"
      show-optional
    />

    <div class="field">
      <label class="field__label" for="menu-category">{{ $t('admin.menu.form.category') }}</label>
      <select
        id="menu-category"
        v-model.number="draft.category"
        class="control"
        :class="{ 'control--invalid': errors.category }"
      >
        <option :value="null">{{ $t('admin.menu.form.categoryPlaceholder') }}</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <p v-if="errors.category" class="field__error">{{ errors.category }}</p>
    </div>

    <div class="grid">
      <BaseInput
        v-model="draft.price"
        name="price"
        inputmode="decimal"
        :label="$t('admin.menu.form.price')"
        :error="errors.price"
        required
      />
      <BaseInput
        v-model="draft.preparationTime"
        name="preparation_time"
        inputmode="numeric"
        :label="$t('admin.menu.form.preparationTime')"
        :error="errors.preparationTime"
        show-optional
      />
      <BaseInput
        v-model="draft.calories"
        name="calories"
        inputmode="numeric"
        :label="$t('admin.menu.form.calories')"
        :error="errors.calories"
        show-optional
      />
    </div>

    <BaseInput
      v-model="draft.allergens"
      name="allergens"
      :label="$t('admin.menu.form.allergens')"
      :hint="$t('admin.menu.form.allergensHint')"
      :error="errors.allergens"
      show-optional
    />

    <label class="field field--check">
      <input v-model="draft.isFeatured" type="checkbox" />
      <span>{{ $t('admin.menu.form.isFeatured') }}</span>
    </label>

    <div class="field">
      <label class="field__label" for="menu-image">{{ $t('admin.menu.form.image') }}</label>
      <input
        id="menu-image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        @change="onImage"
      />
      <p class="field__hint">{{ $t('admin.menu.form.imageHint') }}</p>
      <p v-if="errors.image" class="field__error">{{ errors.image }}</p>
    </div>

    <img v-if="preview" :src="preview" alt="" class="preview" />

    <div class="cluster">
      <BaseButton type="submit" :loading="submitting" :disabled="submitting">
        {{ $t('common.confirm') }}
      </BaseButton>
      <BaseButton type="button" variant="ghost" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </BaseButton>
    </div>
  </form>
</template>

<script>
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import formErrors from '@/mixins/formErrors'
import { adminMenuService } from '@/services/adminMenuService'
import { useToastStore } from '@/store/toasts'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const MAX_ALLERGENS = 20

export default {
  name: 'MenuItemForm',
  components: { BaseButton, BaseInput, FormAlert },
  mixins: [formErrors],
  props: {
    item: { type: Object, default: null },
    categories: { type: Array, required: true },
  },
  emits: ['saved', 'cancel'],
  data() {
    return {
      draft: {
        name: this.item?.name || '',
        description: this.item?.description || '',
        category: this.item?.category || null,
        price: this.item?.price || '',
        preparationTime: this.item?.preparation_time ?? '',
        calories: this.item?.calories ?? '',
        allergens: (this.item?.allergens || []).join(', '),
        isFeatured: Boolean(this.item?.is_featured),
        image: null,
      },
      preview: this.item?.image || null,
      objectUrl: null,
    }
  },
  beforeUnmount() {
    this.revokePreview()
  },
  methods: {
    revokePreview() {
      if (this.objectUrl) {
        URL.revokeObjectURL(this.objectUrl)
        this.objectUrl = null
      }
    },

    onImage(event) {
      this.revokePreview()
      const file = event.target.files?.[0] || null
      if (!file) {
        this.draft.image = null
        this.preview = this.item?.image || null
        return
      }
      if (file.size > MAX_IMAGE_BYTES) {
        this.errors = { ...this.errors, image: this.$t('admin.menu.form.imageTooBig') }
        this.draft.image = null
        this.preview = this.item?.image || null
        event.target.value = ''
        return
      }
      this.draft.image = file
      this.objectUrl = URL.createObjectURL(file)
      this.preview = this.objectUrl
      this.errors = Object.fromEntries(
        Object.entries(this.errors).filter(([key]) => key !== 'image'),
      )
    },

    validate() {
      const next = {}
      if (!this.draft.name.trim()) next.name = this.$t('admin.menu.form.validation.name')
      if (!this.draft.category) next.category = this.$t('admin.menu.form.validation.category')
      if (
        this.draft.price === '' ||
        Number.isNaN(Number(this.draft.price)) ||
        Number(this.draft.price) <= 0
      ) {
        next.price = this.$t('admin.menu.form.validation.price')
      }
      if (
        this.draft.preparationTime !== '' &&
        (!Number.isInteger(Number(this.draft.preparationTime)) || Number(this.draft.preparationTime) < 0)
      ) {
        next.preparationTime = this.$t('admin.menu.form.validation.preparationTime')
      }
      if (
        this.draft.calories !== '' &&
        (!Number.isInteger(Number(this.draft.calories)) || Number(this.draft.calories) <= 0)
      ) {
        next.calories = this.$t('admin.menu.form.validation.calories')
      }
      const allergens = this.draft.allergens
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)
      if (allergens.length > MAX_ALLERGENS) {
        next.allergens = this.$t('admin.menu.form.validation.allergens', { max: MAX_ALLERGENS })
      }
      this.errors = next
      return Object.keys(next).length === 0
    },

    async submit() {
      if (this.submitting) return
      this.clearErrors()
      if (!this.validate()) return

      const allergens = Array.from(
        new Set(
          this.draft.allergens
            .split(',')
            .map((a) => a.trim().toLowerCase())
            .filter(Boolean),
        ),
      )

      const payload = {
        name: this.draft.name.trim(),
        description: this.draft.description.trim(),
        category: this.draft.category,
        price: String(this.draft.price),
        preparation_time: this.draft.preparationTime === '' ? null : Number(this.draft.preparationTime),
        calories: this.draft.calories === '' ? null : Number(this.draft.calories),
        allergens,
        is_featured: this.draft.isFeatured,
        image: this.draft.image,
      }

      this.submitting = true
      try {
        const saved = this.item
          ? await adminMenuService.update(this.item.id, payload)
          : await adminMenuService.create(payload)
        useToastStore().success(this.$t('admin.menu.form.saved'))
        this.$emit('saved', saved)
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

.field--check {
  flex-direction: row;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--target-size);
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

.preview {
  max-width: 12rem;
  border-radius: var(--radius-md);
}
</style>
