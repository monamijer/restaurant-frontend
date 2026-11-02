<template>
  <div class="stepper" role="group" :aria-label="$t('cart.quantity')">
    <button
      type="button"
      class="stepper__button"
      :aria-label="$t('cart.decrease', { name: label })"
      :disabled="modelValue <= min"
      @click="$emit('update:modelValue', modelValue - 1)"
    >
      <span aria-hidden="true">−</span>
    </button>
    <span class="stepper__value" aria-live="polite">{{ modelValue }}</span>
    <button
      type="button"
      class="stepper__button"
      :aria-label="$t('cart.increase', { name: label })"
      :disabled="modelValue >= max"
      @click="$emit('update:modelValue', modelValue + 1)"
    >
      <span aria-hidden="true">+</span>
    </button>
  </div>
</template>

<script>
import { MAX_LINE_QUANTITY } from '@/config'

export default {
  name: 'QuantityStepper',
  props: {
    modelValue: { type: Number, required: true },
    label: { type: String, required: true }, // The dish name, so each button says what it changes.
    min: { type: Number, default: 1 },
    max: { type: Number, default: MAX_LINE_QUANTITY },
  },
  emits: ['update:modelValue'],
}
</script>

<style scoped>
.stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
}

.stepper__button {
  width: var(--target-size);
  height: var(--target-size);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  background: transparent;
  border: 0;
  cursor: pointer;
}

.stepper__button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (hover: hover) {
  .stepper__button:hover:not(:disabled) {
    background: var(--color-surface-sunken);
  }
}

.stepper__value {
  min-width: 2.5rem;
  font-weight: 600;
  text-align: center;
}
</style>
