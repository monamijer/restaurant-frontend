<template>
  <article class="legal container">
    <header class="legal__header">
      <p class="eyebrow">{{ $t(`legal.${doc}.eyebrow`) }}</p>
      <h1>{{ $t(`legal.${doc}.title`) }}</h1>
      <p class="legal__intro">{{ $t(`legal.${doc}.intro`) }}</p>
      <p class="muted legal__meta">{{ $t('legal.lastUpdated', { date: lastUpdated }) }}</p>
    </header>

    <aside class="legal__notice" role="note">
      <p>{{ $t('legal.notice') }}</p>
    </aside>

    <section class="legal__summary" :aria-labelledby="`${doc}-summary`">
      <h2 :id="`${doc}-summary`" class="legal__summary-title">{{ $t('legal.summaryTitle') }}</h2>
      <ul>
        <li v-for="key in summary" :key="key">{{ $t(`legal.${doc}.summary.${key}`) }}</li>
      </ul>
    </section>

    <div class="legal__layout">
      <nav class="legal__contents" :aria-label="$t('legal.contentsTitle')">
        <p class="legal__contents-title">{{ $t('legal.contentsTitle') }}</p>
        <ol>
          <li v-for="section in sections" :key="section">
            <a :href="`#${doc}-${section}`" @click.prevent="goTo(section)">
              {{ $t(`legal.${doc}.sections.${section}.title`) }}
            </a>
          </li>
        </ol>
      </nav>

      <div class="legal__body">
        <section v-for="section in sections" :id="`${doc}-${section}`" :key="section" class="legal__section">
          <h2>{{ $t(`legal.${doc}.sections.${section}.title`) }}</h2>
          <p>{{ $t(`legal.${doc}.sections.${section}.body`) }}</p>
        </section>
      </div>
    </div>

    <p class="legal__contact">
      {{ $t('legal.contactLine') }}
      <a href="mailto:hello@maisha.example">hello@maisha.example</a>
    </p>
  </article>
</template>

<script>
// One layout for the privacy policy and the terms: the texts live in the `legal` namespace.
export default {
  name: 'LegalDocument',
  props: {
    doc: { type: String, required: true },
    sections: { type: Array, required: true },
    summary: { type: Array, default: () => ['a', 'b', 'c', 'd'] },
    lastUpdated: { type: String, default: '2026-11-05' },
  },
  methods: {
    goTo(section) {
      const target = document.getElementById(`${this.doc}-${section}`)
      if (!target) return
      const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      target.scrollIntoView?.({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
    },
  },
}
</script>

<style scoped>
.legal {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 62rem;
  padding-block: var(--space-7);
}

.legal__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.legal__intro {
  max-width: 44rem;
  font-size: var(--text-lg);
  color: var(--color-text-muted);
}

.legal__meta {
  font-size: var(--text-sm);
}

.legal__notice {
  padding: var(--space-4);
  background: var(--color-warning-surface);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--text-sm);
}

.legal__summary {
  padding: var(--space-5);
  background: var(--color-accent-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.legal__summary-title {
  margin-bottom: var(--space-3);
  font-size: var(--text-lg);
  color: var(--color-accent-text);
}

.legal__summary ul {
  display: grid;
  gap: var(--space-2);
  padding-left: var(--space-5);
  margin: 0;
}

.legal__layout {
  display: grid;
  gap: var(--space-6);
}

.legal__contents {
  font-size: var(--text-sm);
}

.legal__contents-title {
  margin-bottom: var(--space-2);
  font-weight: 700;
}

.legal__contents ol {
  display: grid;
  gap: var(--space-1);
  padding-left: 0;
  margin: 0;
  list-style: none;
}

.legal__contents a {
  display: block;
  padding-block: var(--space-1);
  color: var(--color-text-muted);
  text-decoration: none;
}

.legal__contents a:hover {
  color: var(--color-accent-text);
  text-decoration: underline;
}

.legal__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 44rem;
}

.legal__section {
  scroll-margin-top: calc(var(--header-height, 4rem) + var(--space-4));
}

.legal__section h2 {
  margin-bottom: var(--space-2);
  font-size: var(--text-xl);
}

.legal__section p {
  line-height: 1.7;
}

.legal__contact {
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

@media (min-width: 60rem) {
  .legal__layout {
    grid-template-columns: 15rem 1fr;
    align-items: start;
  }

  .legal__contents {
    position: sticky;
    top: calc(var(--header-height, 4rem) + var(--space-5));
  }
}
</style>
