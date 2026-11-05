import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import AdminUsersView from '../../../src/views/admin/AdminUsersView.vue'
import { adminUserService } from '../../../src/services/adminUserService'

const PAGE = (results) => ({ count: results.length, next: null, previous: null, results })
const USER = {
  id: 5, email: 'ada@example.com', first_name: 'Ada', last_name: 'L',
  role: 'client', is_active: true, orders_count: 3, total_spent: '45.00', last_order_at: null,
}

describe('AdminUsersView', () => {
  it('lists users with their role, status and stats', async () => {
    vi.spyOn(adminUserService, 'list').mockResolvedValue(PAGE([USER]))
    const { wrapper } = await mountAt(AdminUsersView, '/admin/users', { user: USERS.admin })
    await flushPromises()
    const row = wrapper.get('tbody tr').text()
    expect(row).toContain('Ada L')
    expect(row).toContain('ada@example.com')
    expect(row).toContain('Client')
    expect(row).toContain('Active')
    expect(row).toContain('3')
    expect(row).toContain('$45.00')
  })

  it('passes the filters to the service', async () => {
    const spy = vi.spyOn(adminUserService, 'list').mockResolvedValue(PAGE([]))
    await mountAt(AdminUsersView, '/admin/users?role=staff&search=ada&active=1', { user: USERS.admin })
    await flushPromises()
    expect(spy).toHaveBeenCalledWith({
      page: 1, page_size: 20, ordering: '-created_at',
      role: 'staff', search: 'ada', is_active: true,
    })
  })

  it('offers a retry when the list fails', async () => {
    vi.spyOn(adminUserService, 'list').mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountAt(AdminUsersView, '/admin/users', { user: USERS.admin })
    await flushPromises()
    expect(wrapper.text()).toContain('Could not load the users.')
    expect(wrapper.findAll('button').some((b) => b.text() === 'Try again')).toBe(true)
  })
})
