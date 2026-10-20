import { defineStore } from 'pinia'
import { SUPPORTED_LOCALES } from '@/config'
import { applyLocale, detectLocale, LOCALE_KEY } from '@/i18n'

export const THEME_KEY = 'restaurant.theme'
const THEMES = ['light', 'dark']

function readTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (THEMES.includes(stored)) return stored
  } catch {
    // Storage unavailable: use the system preference.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function remember(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Not remembering a preference is harmless.
  }
}

/** Interface preferences: theme and language. Both are remembered between visits. */
export const useUiStore = defineStore('ui', {
  state: () => ({
    theme: readTheme(),
    locale: detectLocale(),
  }),

  getters: {
    isDark: (state) => state.theme === 'dark',
  },

  actions: {
    /** Push the stored preferences to the page. Called once at start-up. */
    init() {
      document.documentElement.setAttribute('data-theme', this.theme)
      applyLocale(this.locale)
    },

    setTheme(theme) {
      if (!THEMES.includes(theme)) return
      this.theme = theme
      document.documentElement.setAttribute('data-theme', theme)
      remember(THEME_KEY, theme)
    },

    toggleTheme() {
      this.setTheme(this.isDark ? 'light' : 'dark')
    },

    setLocale(locale) {
      if (!SUPPORTED_LOCALES.includes(locale)) return
      this.locale = locale
      applyLocale(locale)
      remember(LOCALE_KEY, locale)
    },
  },
})
