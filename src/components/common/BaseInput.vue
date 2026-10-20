<template>
  <div class="field" :class="{ 'field--invalid': error }">
    <label class="field__label" :for="uid">
      {{ label }}
      <span v-if="required" class="field__flag" aria-hidden="true">*</span>
      <span v-else-if="showOptional" class="field__flag field__flag--muted">
        ({{ $t('common.optional') }})
      </span>
    </label>

    <div class="field__control">
      <input
        :id="uid"
        class="field__input"
        :type="inputType"
        :value="modelValue"
        :name="name || null"
        :autocomplete="autocomplete || null"
        :inputmode="inputmode || null"
        :placeholder="placeholder || null"
        :maxlength="maxlength || null"
        :required="required"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : null"
        :aria-describedby="describedBy"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <button
        v-if="type === 'password'"
        type="button"
        class="field__toggle"
        :aria-pressed="revealed ? 'true' : 'false'"
        @click="revealed = !revealed"
      >
        {{ revealed ? $t('common.hidePassword') : $t('common.showPassword') }}
      </button>
    </div>

    <p v-if="hint && !error" :id="hintId" class="field__hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="field__error">{{ error }}</p>
  </div>
</template>

<script>
let nextId = 0

export default {
  name: 'BaseInput',
  props: {
    modelValue: { type: [String, Number], default: '' },
    label: { type: String, required: true },
    type: { type: String, default: 'text' },
    name: { type: String, default: '' },
    error: { type: String, default: '' },
    hint: { type: String, default: '' },
    autocomplete: { type: String, default: '' },
    inputmode: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    maxlength: { type: Number, default: 0 },
    required: { type: Boolean, default: false },
    showOptional: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      uid: `field-${++nextId}`,
      revealed: false,
    }
  },
  computed: {
    inputType() {
      return this.type === 'password' && this.revealed ? 'text' : this.type
    },
    hintId() {
      return `${this.uid}-hint`
    },
    errorId() {
      return `${this.uid}-error`
    },
    describedBy() {
      const ids = []
      if (this.error) ids.push(this.errorId)
      else if (this.hint) ids.push(this.hintId)
      return ids.join(' ') || null
    },
  },
}
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.field__label {
  font-size: var(--text-sm);
  font-weight: 600;
}

.field__flag {
  margin-inline-start: 0.15em;
  color: var(--color-danger);
}

.field__flag--muted {
  font-weight: 400;
  color: var(--color-text-muted);
}

.field__control {
  position: relative;
  display: flex;
}

.field__input {
  flex: 1;
  min-width: 0;
  min-height: var(--target-size);
  padding: 0 var(--space-4);
  font-size: 1rem; /* 16px: stops iOS from zooming into the field */
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  transition: border-color var(--duration-fast) var(--ease-out);
}

.field__input::placeholder {
  color: var(--color-text-muted);
  opacity: 0.8;
}

.field__input:disabled {
  opacity: 0.6;
  background: var(--color-surface-sunken);
}

.field--invalid .field__input {
  border-color: var(--color-danger);
}

.field__toggle {
  position: absolute;
  inset-block: 0;
  inset-inline-end: 0;
  min-width: var(--target-size);
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-primary);
  background: transparent;
  border: 0;
  cursor: pointer;
}

.field__hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.field__error {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-danger);
}
</style>
