import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import StaffCustomersView from '../../../src/views/staff/StaffCustomersView.vue'
import { staffCustomerService } from '../../../src/services/staffCustomerService'

const CUSTOMER = {
  id: 5, email: 'ada@example.com', first_name: 'Ada', last_name: 'Lovelace', phone: '+25762000000',
  role: 'client', is_active: true, orders_count: 3, total_spent: '42.00', last_order_at: '2026-11-05T18:00:00Z',
}
const PAGE = (results) => ({ count: results.length, next: null, previous: null, results })

describe('StaffCustomersView', () => {
  it('lists customers read-only with their activity', async () => {
    vi.spyOn(staffCustomerService, 'list').mockResolvedValue(PAGE([CUSTOMER]))
    const { wrapper } = await mountAt(StaffCustomersView, '/staff/customers', { user: USERS.staff })
    await flushPromises()
    expect(wrapper.text()).toContain('Ada Lovelace')
    expect(wrapper.text()).toContain('ada@example.com')
    expect(wrapper.text()).toContain('3')
    expect(wrapper.findAll('table button')).toHaveLength(0)
  })

  it('passes the search to the service', async () => {
    const spy = vi.spyOn(staffCustomerService, 'list').mockResolvedValue(PAGE([]))
    await mountAt(StaffCustomersView, '/staff/customers?search=ada', { user: USERS.staff })
    await flushPromises()
    expect(spy).toHaveBeenCalledWith({ page: 1, page_size: 20, search: 'ada' })
  })

  it('offers a retry when the list fails', async () => {
    vi.spyOn(staffCustomerService, 'list').mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountAt(StaffCustomersView, '/staff/customers', { user: USERS.staff })
    await flushPromises()
    expect(wrapper.text()).toContain('Could not load customers.')
  })
})
