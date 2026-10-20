import { createI18n } from 'vue-i18n'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/config'
import en from './locales/en'
import fr from './locales/fr'

export const LOCALE_KEY = 'restaurant.locale'

/**
 * The saved choice, else English. The browser language is deliberately not consulted: the
 * application opens in English for everyone until a visitor picks another language.
 */
export function detectLocale() {
  try {
    const stored = window.localStorage.getItem(LOCALE_KEY)
    if (SUPPORTED_LOCALES.includes(stored)) return stored
  } catch {
    // Storage unavailable: use the default.
  }
  return DEFAULT_LOCALE
}

// Composition mode is vue-i18n's current mode (the legacy mode is deprecated). Components still
// use the Options API: `globalInjection` exposes $t, $n and $d on `this` and in templates.
export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: { en, fr },
})

export function applyLocale(locale) {
  i18n.global.locale.value = locale
  document.documentElement.setAttribute('lang', locale)
}

export function translate(key, params) {
  return i18n.global.t(key, params ?? {})
}
