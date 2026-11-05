<template>
  <div class="legal container">
    <p class="eyebrow">{{ $t('legal.privacy.eyebrow') }}</p>
    <h1>{{ $t('legal.privacy.title') }}</h1>
    <p class="muted legal__meta">{{ $t('legal.lastUpdated', { date: lastUpdated }) }}</p>

    <aside class="legal__notice" role="note">
      <p>{{ $t('legal.notice') }}</p>
    </aside>

    <section v-for="section in sections" :key="section.key" class="legal__section">
      <h2>{{ $t(`legal.privacy.sections.${section.key}.title`) }}</h2>
      <p>{{ $t(`legal.privacy.sections.${section.key}.body`) }}</p>
    </section>

    <p class="legal__contact">
      {{ $t('legal.contactLine') }}
      <a href="mailto:hello@maisha.example">hello@maisha.example</a>
    </p>
  </div>
</template>

<script>
export default {
  name: 'PrivacyPolicyView',
  data() {
    return {
      lastUpdated: '2026-11-05',
      sections: [
        { key: 'data' },
        { key: 'purpose' },
        { key: 'retention' },
        { key: 'access' },
        { key: 'cookies' },
        { key: 'rights' },
      ],
    }
  },
}
</script>

<style scoped>
.legal {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 48rem;
  padding-block: var(--space-7);
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

.legal__section h2 {
  font-size: var(--text-xl);
  margin-bottom: var(--space-2);
}

.legal__section p {
  line-height: 1.7;
  color: var(--color-text);
}

.legal__contact {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}
</style>
