import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import AdminMenuView from '../../../src/views/admin/AdminMenuView.vue'
import { adminMenuService } from '../../../src/services/adminMenuService'
import { menuService } from '../../../src/services/menuService'

const CATEGORIES = [{ id: 1, name: 'Starters', slug: 'starters' }]
const ITEM = {
  id: 7, name: 'Pasta', category: 1, category_name: 'Starters',
  price: '12.50', image: null, is_available: true, preparation_time: 10,
  is_featured: false, allergens: [], calories: null,
}
const PAGE = (results) => ({ count: results.length, next: null, previous: null, results })

function stub(list = [ITEM]) {
  vi.spyOn(menuService, 'categories').mockResolvedValue(CATEGORIES)
  vi.spyOn(adminMenuService, 'list').mockResolvedValue(PAGE(list))
}

describe('AdminMenuView', () => {
  it('lists the dishes and their availability', async () => {
    stub()
    const { wrapper } = await mountAt(AdminMenuView, '/admin/menu', { user: USERS.admin })
    await flushPromises()
    expect(wrapper.text()).toContain('Pasta')
    expect(wrapper.text()).toContain('On the menu')
  })

  it('toggles availability through setAvailability', async () => {
    stub()
    vi.spyOn(adminMenuService, 'setAvailability').mockResolvedValue({ ...ITEM, is_available: false })
    const { wrapper } = await mountAt(AdminMenuView, '/admin/menu', { user: USERS.admin })
    await flushPromises()
    const toggle = wrapper.findAll('button').find((b) => b.text() === 'Remove from the menu')
    await toggle.trigger('click')
    await flushPromises()
    expect(adminMenuService.setAvailability).toHaveBeenCalledWith(7, false)
  })

  it('passes the filters to the service', async () => {
    stub([])
    await mountAt(AdminMenuView, '/admin/menu?category=starters&q=pasta', { user: USERS.admin })
    await flushPromises()
    expect(adminMenuService.list).toHaveBeenCalledWith({
      page: 1, page_size: 20, category_slug: 'starters', search: 'pasta',
    })
  })

  it('offers a retry when the list fails', async () => {
    vi.spyOn(menuService, 'categories').mockResolvedValue(CATEGORIES)
    vi.spyOn(adminMenuService, 'list').mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountAt(AdminMenuView, '/admin/menu', { user: USERS.admin })
    await flushPromises()
    expect(wrapper.text()).toContain('Could not load the menu.')
    expect(wrapper.findAll('button').some((b) => b.text() === 'Try again')).toBe(true)
  })
})
