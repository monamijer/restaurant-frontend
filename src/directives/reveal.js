/**
 * v-reveal
 * Adds `reveal` on mount and `reveal--visible` once the element enters the viewport.
 * When the user prefers reduced motion, the element is visible from the start.
 *
 * Usage: <section v-reveal>…</section>
 * Options: v-reveal="{ delay: 150 }" (ms), v-reveal.once (default: true) — reveal once.
 */
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

export const reveal = {
  mounted(el, binding) {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia?.(REDUCED_MOTION).matches
    if (prefersReduced || !('IntersectionObserver' in window)) {
      el.classList.add('reveal--visible')
      return
    }

    el.classList.add('reveal')
    const delay = Number(binding.value?.delay) || 0
    if (delay) el.style.transitionDelay = `${delay}ms`

    const once = binding.modifiers.once !== false
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          el.classList.add('reveal--visible')
          if (once) observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    )
    observer.observe(el)
    el.__revealObserver = observer
  },
  unmounted(el) {
    el.__revealObserver?.disconnect()
    delete el.__revealObserver
  },
}
