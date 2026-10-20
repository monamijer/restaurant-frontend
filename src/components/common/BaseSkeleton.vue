<template>
  <span class="skeleton" :class="{ 'skeleton--circle': circle }" :style="style" aria-hidden="true" />
</template>

<script>
export default {
  name: 'BaseSkeleton',
  props: {
    width: { type: String, default: '100%' },
    height: { type: String, default: '1rem' },
    circle: { type: Boolean, default: false },
  },
  computed: {
    style() {
      return { width: this.width, height: this.height }
    },
  },
}
</script>

<style scoped>
.skeleton {
  display: block;
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    var(--color-surface-sunken) 25%,
    var(--color-border) 50%,
    var(--color-surface-sunken) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.skeleton--circle {
  border-radius: 50%;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
</style>
