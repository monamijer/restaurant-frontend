import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { LOCALE_KEY } from '@/i18n'
import { THEME_KEY, useUiStore } from '@/store/ui'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('theme', () => {
  it('follows the system preference when nothing is saved', () => {
    window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} })

    expect(useUiStore().theme).toBe('dark')
  })

  it('prefers a saved choice over the system preference', () => {
    window.localStorage.setItem(THEME_KEY, 'light')
    window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} })

    expect(useUiStore().theme).toBe('light')
  })

  it('toggles, updates the page and remembers the choice', () => {
    const ui = useUiStore()
    ui.setTheme('light')

    ui.toggleTheme()

    expect(ui.isDark).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(window.localStorage.getItem(THEME_KEY)).toBe('dark')
  })

  it('ignores an unknown theme', () => {
    const ui = useUiStore()
    ui.setTheme('light')

    ui.setTheme('neon')

    expect(ui.theme).toBe('light')
  })
})

describe('language', () => {
  it('starts in English', () => {
    expect(useUiStore().locale).toBe('en')
  })

  it('switches, updates the page and remembers the choice', () => {
    const ui = useUiStore()

    ui.setLocale('fr')

    expect(ui.locale).toBe('fr')
    expect(document.documentElement.getAttribute('lang')).toBe('fr')
    expect(window.localStorage.getItem(LOCALE_KEY)).toBe('fr')

    ui.setLocale('en')
  })

  it('ignores an unsupported language', () => {
    const ui = useUiStore()

    ui.setLocale('de')

    expect(ui.locale).toBe('en')
  })

  it('init pushes the saved preferences to the page', () => {
    window.localStorage.setItem(THEME_KEY, 'dark')
    const ui = useUiStore()

    ui.init()

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.getAttribute('lang')).toBe('en')
  })
})
