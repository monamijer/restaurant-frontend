<template>
  <footer class="footer">
    <div class="footer__top container">
      <div class="footer__cols">
        <section v-for="col in columns" :key="col.key" class="footer__col" :aria-labelledby="`footer-col-${col.key}`">
          <h2 :id="`footer-col-${col.key}`" class="footer__title">{{ $t(`footer.columns.${col.key}.title`) }}</h2>
          <ul class="footer__list">
            <li v-for="link in col.links" :key="link.key">
              <RouterLink v-if="link.route" class="footer__link" :to="link.route">
                {{ $t(`footer.columns.${col.key}.links.${link.key}`) }}
              </RouterLink>
              <a
                v-else-if="link.href"
                class="footer__link"
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ $t(`footer.columns.${col.key}.links.${link.key}`) }}
              </a>
              <span v-else class="footer__link footer__link--soon">
                {{ $t(`footer.columns.${col.key}.links.${link.key}`) }}
              </span>
            </li>
          </ul>
        </section>
      </div>

      <div class="footer__prefs">
        <div class="footer__pref">
          <LocaleSwitcher />
        </div>
        <div class="footer__pref" aria-disabled="true">
          <span class="footer__pref-label">{{ $t('footer.currencyLabel') }}</span>
          <span class="footer__pref-value">{{ $t('footer.currencyValue') }}</span>
        </div>
        <div class="footer__pref" aria-disabled="true">
          <span class="footer__pref-label">{{ $t('footer.countryLabel') }}</span>
          <span class="footer__pref-value">{{ $t('footer.countryValue') }}</span>
        </div>
      </div>

      <div class="footer__brand">
        <div>
          <p class="footer__name">{{ name }}</p>
          <p class="footer__rights muted">&copy; {{ year }} {{ name }}. {{ $t('footer.rights') }}</p>
        </div>
        <SocialLinks />
      </div>
    </div>

    <div class="footer__legal">
      <div class="container footer__legal-inner">
        <ul class="footer__legal-links">
          <li><RouterLink class="footer__link" :to="{ name: 'privacy' }">{{ $t('footer.privacy') }}</RouterLink></li>
          <li><RouterLink class="footer__link" :to="{ name: 'terms' }">{{ $t('footer.terms') }}</RouterLink></li>
          <li><a class="footer__link" href="mailto:hello@maisha.example">{{ $t('footer.contact') }}</a></li>
        </ul>
        <p class="muted footer__hours">
          <template v-if="hasHours">{{ $t('footer.hoursValue', { open: opensAt, close: closesAt }) }}</template>
          <template v-else>{{ $t('footer.hoursUnknown') }}</template>
        </p>
      </div>
    </div>
  </footer>
</template>

<script>
import { mapState } from 'pinia'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import SocialLinks from '@/components/layout/SocialLinks.vue'
import { useRestaurantStore } from '@/store/restaurant'

export default {
  name: 'AppFooter',
  components: { LocaleSwitcher, SocialLinks },
  data() {
    return {
      columns: [
        {
          key: 'about',
          links: [
            { key: 'story', route: { name: 'home' } },
            { key: 'menu', route: { name: 'menu' } },
            { key: 'reservations', route: { name: 'reservations' } },
          ],
        },
        {
          key: 'features',
          links: [
            { key: 'orders', route: { name: 'orders' } },
            { key: 'queue', route: { name: 'queue' } },
            { key: 'invoices', route: { name: 'invoices' } },
            { key: 'notifications', route: { name: 'notifications' } },
          ],
        },
        {
          key: 'help',
          links: [
            { key: 'account', route: { name: 'client-account' } },
            { key: 'contact', href: 'mailto:hello@maisha.example' },
            { key: 'faq' },
          ],
        },
        {
          key: 'legal',
          links: [
            { key: 'privacy', route: { name: 'privacy' } },
            { key: 'terms', route: { name: 'terms' } },
            { key: 'cookies' },
          ],
        },
      ],
    }
  },
  computed: {
    ...mapState(useRestaurantStore, ['name', 'opensAt', 'closesAt', 'hasHours']),
    year() {
      return new Date().getFullYear()
    },
  },
}
</script>

<style scoped>
.footer {
  margin-top: var(--space-9);
  background: var(--color-surface-sunken);
  border-top: 1px solid var(--color-border);
  color: var(--color-text);
}

.footer__top {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  padding-block: var(--space-8) var(--space-7);
}

.footer__cols {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
}

.footer__title {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--color-text);
  margin-bottom: var(--space-3);
}

.footer__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0;
  margin: 0;
  list-style: none;
}

.footer__link {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-out);
}

.footer__link:hover {
  color: var(--color-text);
  text-decoration: underline;
}

.footer__link--soon {
  opacity: 0.5;
  cursor: default;
}

.footer__prefs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding-block: var(--space-4);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.footer__pref {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
}

.footer__pref[aria-disabled='true'] {
  color: var(--color-text-muted);
}

.footer__pref-label {
  color: var(--color-text-muted);
}

.footer__pref-value {
  font-weight: 600;
}

.footer__brand {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.footer__name {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
}

.footer__rights {
  font-size: var(--text-sm);
}

.footer__legal {
  padding-block: var(--space-4);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.footer__legal-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.footer__legal-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding: 0;
  margin: 0;
  list-style: none;
}

.footer__hours {
  font-size: var(--text-sm);
}
</style>
