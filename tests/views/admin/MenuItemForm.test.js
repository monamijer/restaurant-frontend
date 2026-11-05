import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { applyLocale, i18n } from '@/i18n'
import MenuItemForm from '../../../src/views/admin/MenuItemForm.vue'
import { adminMenuService } from '../../../src/services/adminMenuService'

const CATEGORIES = [
  { id: 1, name: 'Starters', slug: 'starters' },
  { id: 2, name: 'Mains', slug: 'mains' },
]

function mountForm(props = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  applyLocale('en')
  return mount(MenuItemForm, {
    props: { categories: CATEGORIES, ...props },
    global: { plugins: [pinia, i18n] },
  })
}

describe('MenuItemForm', () => {
  it('refuses an empty name and a missing category', async () => {
    const spy = vi.spyOn(adminMenuService, 'create').mockResolvedValue({ id: 1 })
    const wrapper = mountForm()
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(spy).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('A name is required.')
    expect(wrapper.text()).toContain('A category is required.')
  })

  it('sends the dish fields to the service, allergens as a deduped lowercase list', async () => {
    const spy = vi.spyOn(adminMenuService, 'create').mockResolvedValue({ id: 42 })
    const wrapper = mountForm()
    await wrapper.find('input[name="name"]').setValue('Pasta')
    await wrapper.find('select#menu-category').setValue('1')
    await wrapper.find('input[name="price"]').setValue('12.50')
    await wrapper.find('input[name="allergens"]').setValue('Gluten, Nuts, gluten')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(spy).toHaveBeenCalledTimes(1)
    const payload = spy.mock.calls[0][0]
    expect(payload.name).toBe('Pasta')
    expect(payload.category).toBe(1)
    expect(payload.price).toBe('12.50')
    expect(payload.allergens).toEqual(['gluten', 'nuts'])
  })

  it('refuses a picture larger than 2 MB', async () => {
    const wrapper = mountForm()
    const file = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await flushPromises()
    expect(wrapper.text()).toContain('The picture must not exceed 2 MB.')
  })
})
