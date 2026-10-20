import { describe, expect, it } from 'vitest'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import { useUiStore } from '@/store/ui'
import { applyLocale } from '@/i18n'
import { mountWithApp } from '../helpers/mount'

describe('ThemeToggle', () => {
  it('says what it will do and does it', async () => {
    const wrapper = mountWithApp(ThemeToggle)
    useUiStore().setTheme('light')
    await wrapper.vm.$nextTick()
    expect(wrapper.attributes('aria-label')).toBe('Switch to dark theme')

    await wrapper.trigger('click')

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(wrapper.attributes('aria-label')).toBe('Switch to light theme')
  })

  it('is a real button the size of a touch target', () => {
    const wrapper = mountWithApp(ThemeToggle)

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
  })
})

describe('LocaleSwitcher', () => {
  it('offers English first and marks the current language', () => {
    const wrapper = mountWithApp(LocaleSwitcher)

    const buttons = wrapper.findAll('button')
    expect(buttons.map((button) => button.text())).toEqual(['EN', 'FR'])
    expect(buttons.map((button) => button.attributes('aria-pressed'))).toEqual(['true', 'false'])
  })

  it('names each language in full and in its own language for screen readers', () => {
    const wrapper = mountWithApp(LocaleSwitcher)

    const [english, french] = wrapper.findAll('button')
    expect(english.attributes('aria-label')).toBe('English')
    expect(english.attributes('lang')).toBe('en')
    expect(french.attributes('aria-label')).toBe('Français')
    expect(french.attributes('lang')).toBe('fr')
  })

  it('switches the language of the whole page', async () => {
    const wrapper = mountWithApp(LocaleSwitcher)

    await wrapper.findAll('button')[1].trigger('click')

    expect(document.documentElement.getAttribute('lang')).toBe('fr')
    expect(wrapper.findAll('button').map((button) => button.attributes('aria-pressed'))).toEqual(['false', 'true'])
    expect(wrapper.get('[role="group"]').attributes('aria-label')).toBe('Langue')

    applyLocale('en')
  })
})
