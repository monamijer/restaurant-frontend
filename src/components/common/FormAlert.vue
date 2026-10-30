<template>
  <p class="form-alert" role="alert"><slot /></p>
</template>

<script>
export default { name: 'FormAlert' }
</script>

<style scoped>
.form-alert {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-danger);
  background: var(--color-danger-surface);
  border-inline-start: 4px solid var(--color-danger);
  border-radius: var(--radius-sm);
}
</style>
