<template>
  <ol class="timeline" :aria-label="$t('order.progress')">
    <li
      v-for="(step, index) in steps"
      :key="step"
      class="timeline__step"
      :class="{ 'timeline__step--done': index < current, 'timeline__step--current': index === current }"
      :aria-current="index === current ? 'step' : null"
    >
      <span class="timeline__dot" aria-hidden="true">{{ index < current ? '✓' : index + 1 }}</span>
      <span class="timeline__label">{{ $t(`orders.status.${step}`) }}</span>
    </li>
  </ol>
</template>

<script>
import { ORDER_STEPS } from '@/utils/orders'

export default {
  name: 'OrderTimeline',
  props: {
    status: { type: String, required: true },
  },
  data() {
    return { steps: ORDER_STEPS }
  },
  computed: {
    current() {
      return ORDER_STEPS.indexOf(this.status)
    },
  },
}
</script>

<style scoped>
.timeline {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-2);
  padding: 0;
  list-style: none;
}

.timeline__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  text-align: center;
  color: var(--color-text-muted);
}

.timeline__dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  font-weight: 700;
  background: var(--color-surface-sunken);
  border: 2px solid var(--color-border-strong);
  border-radius: 50%;
}

.timeline__step--done .timeline__dot {
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.timeline__step--current {
  font-weight: 700;
  color: var(--color-text);
}

.timeline__step--current .timeline__dot {
  color: var(--color-text);
  background: var(--color-accent);
  border-color: var(--color-accent);
}
</style>
