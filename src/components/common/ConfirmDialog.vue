<template>
  <BaseModal :open="open" :title="title" @close="$emit('cancel')">
    <p>{{ message }}</p>

    <template #footer>
      <!-- Cancel takes the initial focus: a destructive action must never be one Enter away. -->
      <BaseButton variant="secondary" autofocus :disabled="loading" @click="$emit('cancel')">
        {{ cancelLabel || $t('common.cancel') }}
      </BaseButton>
      <BaseButton :variant="danger ? 'danger' : 'primary'" :loading="loading" @click="$emit('confirm')">
        {{ confirmLabel || $t('common.confirm') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script>
import BaseButton from './BaseButton.vue'
import BaseModal from './BaseModal.vue'

export default {
  name: 'ConfirmDialog',
  components: { BaseButton, BaseModal },
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, required: true },
    message: { type: String, required: true },
    confirmLabel: { type: String, default: '' },
    cancelLabel: { type: String, default: '' },
    danger: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
  },
  emits: ['confirm', 'cancel'],
}
</script>
