import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import AdminMenuItemNewView from '../../../src/views/admin/AdminMenuItemNewView.vue'
import { menuService } from '../../../src/services/menuService'
import { adminMenuService } from '../../../src/services/adminMenuService'

describe('AdminMenuItemNewView', () => {
  it('creates a dish and navigates to its edit page', async () => {
    vi.spyOn(menuService, 'categories').mockResolvedValue([{ id: 1, name: 'Starters', slug: 'starters' }])
    vi.spyOn(adminMenuService, 'create').mockResolvedValue({ id: 42 })
    const { wrapper, router } = await mountAt(AdminMenuItemNewView, '/admin/menu/new', { user: USERS.admin })
    await flushPromises()

    await wrapper.find('input[name="name"]').setValue('Pasta')
    await wrapper.find('select#menu-category').setValue('1')
    await wrapper.find('input[name="price"]').setValue('12.50')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(adminMenuService.create).toHaveBeenCalled()
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('admin-menu-item-edit'))
  })
})
