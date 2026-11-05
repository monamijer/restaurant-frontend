import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import AdminMenuItemEditView from '../../../src/views/admin/AdminMenuItemEditView.vue'
import { menuService } from '../../../src/services/menuService'
import { adminMenuService } from '../../../src/services/adminMenuService'

const ITEM = {
  id: 7, name: 'Pasta', category: 1, category_name: 'Starters',
  price: '12.50', description: 'Fresh', image: null, is_available: true,
  preparation_time: 10, is_featured: true, allergens: ['gluten'], calories: 400,
}

describe('AdminMenuItemEditView', () => {
  it('loads the dish and updates it', async () => {
    vi.spyOn(menuService, 'categories').mockResolvedValue([{ id: 1, name: 'Starters', slug: 'starters' }])
    vi.spyOn(adminMenuService, 'get').mockResolvedValue(ITEM)
    vi.spyOn(adminMenuService, 'update').mockResolvedValue({ ...ITEM, name: 'Pasta 2' })
    const { wrapper } = await mountAt(AdminMenuItemEditView, '/admin/menu/7/edit', { user: USERS.admin })
    await flushPromises()

    const name = wrapper.find('input[name="name"]')
    expect(name.element.value).toBe('Pasta')
    await name.setValue('Pasta 2')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(adminMenuService.update).toHaveBeenCalled()
    expect(adminMenuService.update.mock.calls[0][0]).toBe(7)
  })

  it('offers a retry when the dish cannot be loaded', async () => {
    vi.spyOn(menuService, 'categories').mockResolvedValue([])
    vi.spyOn(adminMenuService, 'get').mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountAt(AdminMenuItemEditView, '/admin/menu/7/edit', { user: USERS.admin })
    await flushPromises()
    expect(wrapper.text()).toContain('Could not load this dish.')
    expect(wrapper.findAll('button').some((b) => b.text() === 'Try again')).toBe(true)
  })
})
