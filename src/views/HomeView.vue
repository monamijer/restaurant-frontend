<template>
  <div class="home">
    <div class="container">
      <HeroCarousel v-reveal />
    </div>

    <section v-reveal class="section section--tinted">
      <div class="container">
        <h2 class="section__title">{{ $t('home.spaces.title') }}</h2>
        <p class="section__lead">{{ $t('home.spaces.lead') }}</p>

        <ul class="spaces">
          <li v-for="space in spaces" :key="space.key" class="space">
            <span class="space__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28">
                <path :d="space.icon" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <h3 class="space__title">{{ $t(`home.spaces.items.${space.key}.title`) }}</h3>
            <p class="space__lead">{{ $t(`home.spaces.items.${space.key}.lead`) }}</p>
            <RouterLink class="space__link" :to="space.route">
              {{ $t(`home.spaces.items.${space.key}.cta`) }} →
            </RouterLink>
          </li>
        </ul>
      </div>
    </section>

    <section v-reveal class="section">
      <div class="container">
        <h2 class="section__title">{{ $t('home.stack.title') }}</h2>
        <p class="section__lead">{{ $t('home.stack.lead') }}</p>
        <ul class="stack-list" :aria-label="$t('home.stack.title')">
          <li v-for="tech in techs" :key="tech">{{ tech }}</li>
        </ul>
      </div>
    </section>

    <section v-reveal class="section section--tinted">
      <div class="container demo">
        <div>
          <h2 class="section__title">{{ $t('home.demo.title') }}</h2>
          <p class="section__lead">{{ $t('home.demo.lead') }}</p>
          <p class="demo__hint muted">{{ $t('home.demo.passwordHint') }}</p>
        </div>
        <ul class="demo__accounts">
          <li v-for="account in demoAccounts" :key="account.email">
            <span class="demo__role">{{ $t(`home.demo.roles.${account.role}`) }}</span>
            <code class="demo__email">{{ account.email }}</code>
          </li>
        </ul>
        <div class="cluster">
          <BaseButton size="lg" :to="{ name: 'login' }">{{ $t('home.demo.cta') }}</BaseButton>
          <BaseButton size="lg" variant="ghost" :to="{ name: 'menu' }">{{ $t('menu.viewMenu') }}</BaseButton>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import BaseButton from '@/components/common/BaseButton.vue'
import HeroCarousel from '@/components/home/HeroCarousel.vue'

const ICON_CLIENT = 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 1 1 16 0'
const ICON_STAFF = 'M4 6h16M4 12h16M4 18h10'
const ICON_ADMIN = 'M12 3 3 8v8l9 5 9-5V8l-9-5Zm0 0v18M3 8l9 5 9-5'

export default {
  name: 'HomeView',
  components: { BaseButton, HeroCarousel },
  data() {
    return {
      spaces: [
        { key: 'client', route: { name: 'menu' }, icon: ICON_CLIENT },
        { key: 'staff', route: { name: 'login' }, icon: ICON_STAFF },
        { key: 'admin', route: { name: 'login' }, icon: ICON_ADMIN },
      ],
      techs: ['Vue 3', 'Django REST', 'MariaDB', 'JWT', 'Vitest', 'Pinia', 'vue-i18n', 'ReportLab'],
      demoAccounts: [
        { role: 'admin', email: 'admin@demo.example' },
        { role: 'staff', email: 'server@demo.example' },
        { role: 'client', email: 'client1@demo.example' },
      ],
    }
  },
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
}

.spaces {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  padding: 0;
  margin: 0;
  list-style: none;
  margin-top: var(--space-6);
}

.space {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-base) var(--ease-out), box-shadow var(--duration-base) var(--ease-out);
}

.space:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.space__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  color: var(--color-accent);
  background: var(--color-accent-surface);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
}

.space__title {
  font-size: var(--text-xl);
}

.space__lead {
  color: var(--color-text-muted);
}

.space__link {
  margin-top: var(--space-2);
  font-weight: 600;
  color: var(--color-accent-text);
  text-decoration: none;
}

.space__link:hover {
  text-decoration: underline;
}

.stack-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: 0;
  margin: 0;
  margin-top: var(--space-5);
  list-style: none;
}

.stack-list li {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  font-weight: 600;
  background: var(--color-surface-sunken);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
}

.demo {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.demo__hint {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
}

.demo__accounts {
  display: grid;
  gap: var(--space-2);
  padding: 0;
  margin: 0;
  list-style: none;
}

.demo__accounts li {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.demo__role {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent-text);
}

.demo__email {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--text-sm);
}
</style>
