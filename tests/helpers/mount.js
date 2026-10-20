import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { applyLocale, i18n } from '@/i18n'

/** Mount a component with a fresh Pinia and the real translations, in English. */
export function mountWithApp(component, options = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  applyLocale('en')
  const { global = {}, ...rest } = options
  return mount(component, {
    ...rest,
    global: { ...global, plugins: [pinia, i18n, ...(global.plugins ?? [])] },
  })
}
