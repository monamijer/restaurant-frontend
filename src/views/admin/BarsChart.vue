<template>
  <EmptyState v-if="points.length === 0" :title="$t('admin.dashboard.emptySeries')" />
  <ol v-else class="bars" :aria-label="label">
    <li
      v-for="point in normalized"
      :key="point.label"
      class="bar"
      :style="{ '--bar-height': `${point.heightPercent}%` }"
      :title="`${point.label} — ${point.display}`"
      :aria-label="`${point.label} : ${point.display}`"
    >
      <span class="bar__fill" aria-hidden="true"></span>
      <span class="bar__label" aria-hidden="true">{{ point.shortLabel }}</span>
    </li>
  </ol>
</template>

<script>
import EmptyState from '@/components/common/EmptyState.vue'

export default {
  name: 'BarsChart',
  components: { EmptyState },
  props: {
    points: { type: Array, required: true }, // [{ label, value, display }]
    label: { type: String, required: true },
    valueKind: { type: String, default: 'count' },
  },
  computed: {
    max() {
      return this.points.reduce((m, p) => Math.max(m, Number(p.value) || 0), 0)
    },
    normalized() {
      const max = this.max || 1
      return this.points.map((p) => ({
        ...p,
        heightPercent: Math.round(((Number(p.value) || 0) / max) * 100),
        shortLabel: this.shortLabel(p.label),
      }))
    },
  },
  methods: {
    shortLabel(isoDate) {
      // "2026-11-05" -> "05/11"
      if (typeof isoDate !== 'string' || isoDate.length < 10) return isoDate
      return `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`
    },
  },
}
</script>

<style scoped>
.bars {
  display: flex;
  align-items: end;
  gap: 4px;
  height: 10rem;
  padding: 0;
  margin: 0;
  list-style: none;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
}

.bar {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: end;
  align-items: center;
  flex: 1 0 1.25rem;
  height: 100%;
  min-width: 1.25rem;
}

.bar__fill {
  width: 100%;
  height: var(--bar-height, 0%);
  min-height: 1px;
  background: var(--color-primary);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

.bar__label {
  position: absolute;
  bottom: -1.25rem;
  font-size: 0.65rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.bars {
  padding-bottom: 1.5rem;
}
</style>
