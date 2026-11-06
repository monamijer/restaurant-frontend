import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import StaffMenuView from '../../../src/views/staff/StaffMenuView.vue'
import { adminMenuService } from '../../../src/services/adminMenuService'
import { menuService } from '../../../src/services/menuService'

const ITEM = { id: 7, name: 'Pasta', category: 1, category_name: 'Starters', price: '12.50', image: null, is_available: true }
const PAGE = (results) => ({ count: results.length, next: null, previous: null, results })

function stub(list = [ITEM]) {
  vi.spyOn(menuService, 'categories').mockResolvedValue([{ id: 1, name: 'Starters', slug: 'starters' }])
  vi.spyOn(adminMenuService, 'list').mockResolvedValue(PAGE(list))
}

describe('StaffMenuView', () => {
  it('lists the dishes and their availability', async () => {
    stub()
    const { wrapper } = await mountAt(StaffMenuView, '/staff/menu', { user: USERS.staff })
    await flushPromises()
    expect(wrapper.text()).toContain('Pasta')
    expect(wrapper.text()).toContain('On the menu')
  })

  it('toggles availability', async () => {
    stub()
    const spy = vi.spyOn(adminMenuService, 'setAvailability').mockResolvedValue({ ...ITEM, is_available: false })
    const { wrapper } = await mountAt(StaffMenuView, '/staff/menu', { user: USERS.staff })
    await flushPromises()
    await wrapper.findAll('button').find((b) => b.text() === 'Remove from the menu').trigger('click')
    await flushPromises()
    expect(spy).toHaveBeenCalledWith(7, false)
    expect(wrapper.text()).toContain('Off the menu')
  })

  it('passes the filters to the service', async () => {
    stub([])
    await mountAt(StaffMenuView, '/staff/menu?category=starters&q=pasta', { user: USERS.staff })
    await flushPromises()
    expect(adminMenuService.list).toHaveBeenCalledWith({ page: 1, page_size: 20, category_slug: 'starters', search: 'pasta' })
  })
})
