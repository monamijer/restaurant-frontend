import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/config'
import { applyLocale, detectLocale, i18n, LOCALE_KEY, translate } from '@/i18n'
import en from '@/i18n/locales/en'
import fr from '@/i18n/locales/fr'

function flatten(messages, prefix = '') {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'object' ? flatten(value, `${prefix}${key}.`) : [[`${prefix}${key}`, value]],
  )
}

afterEach(() => applyLocale('en'))

describe('translations', () => {
  it('defines exactly the same keys in English and French', () => {
    expect(flatten(fr).map(([key]) => key).sort()).toEqual(flatten(en).map(([key]) => key).sort())
  })

  it.each([
    ['English', en],
    ['French', fr],
  ])('has no empty %s message', (_name, messages) => {
    for (const [key, value] of flatten(messages)) {
      expect(value.trim(), key).not.toBe('')
    }
  })

  it('uses the same placeholders in both languages', () => {
    const placeholders = (text) => (text.match(/\{\w+\}/g) ?? []).sort()
    const french = Object.fromEntries(flatten(fr))
    for (const [key, text] of flatten(en)) {
      expect(placeholders(french[key]), key).toEqual(placeholders(text))
    }
  })
})

describe('default language', () => {
  it('is English', () => {
    expect(DEFAULT_LOCALE).toBe('en')
    expect(SUPPORTED_LOCALES).toEqual(['en', 'fr'])
  })

  it('stays English whatever the browser language is', () => {
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('fr-FR')

    expect(detectLocale()).toBe('en')
  })

  it('follows a saved choice', () => {
    window.localStorage.setItem(LOCALE_KEY, 'fr')

    expect(detectLocale()).toBe('fr')
  })

  it('ignores a saved language that is not supported', () => {
    window.localStorage.setItem(LOCALE_KEY, 'klingon')

    expect(detectLocale()).toBe('en')
  })

  it('falls back to English when a message is missing in another language', () => {
    expect(i18n.global.fallbackLocale.value).toBe(DEFAULT_LOCALE)
  })
})

describe('applying a language', () => {
  it('switches the messages and the page language', () => {
    applyLocale('fr')

    expect(translate('common.cancel')).toBe('Annuler')
    expect(document.documentElement.getAttribute('lang')).toBe('fr')
  })
})
