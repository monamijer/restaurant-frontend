import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import StaffOrdersView from '../../../src/views/staff/StaffOrdersView.vue'
import staffOrderService from '../../../src/services/staffOrderService'

function page(results, count = results.length) {
  return { count, next: null, previous: null, results }
}

const ORDER = {
  id: 42,
  customer_name: 'Ada',
  order_type: 'dine_in',
  status: 'pending',
  total: '34.10',
  created_at: '2026-10-10T17:00:00Z',
}

describe('StaffOrdersView', () => {
  it('lists the orders with status, type and total', async () => {
    vi.spyOn(staffOrderService, 'list').mockResolvedValue(page([ORDER]))
    const { wrapper } = await mountAt(StaffOrdersView, '/staff/orders', { user: USERS.staff })
    await flushPromises()
    const row = wrapper.get('tbody tr')
    expect(row.text()).toContain('#42')
    expect(row.text()).toContain('Ada')
    expect(row.text()).toContain('Pending')
    expect(row.text()).toContain('Eat here')
    expect(row.text()).toContain('$34.10')
  })

  it('passes the active filters to the service', async () => {
    const spy = vi.spyOn(staffOrderService, 'list').mockResolvedValue(page([]))
    await mountAt(StaffOrdersView, '/staff/orders?status=pending&active=1', { user: USERS.staff })
    await flushPromises()
    expect(spy).toHaveBeenCalledWith({ page: 1, page_size: 20, status: 'pending', active: true })
  })

  it('says when there is no order', async () => {
    vi.spyOn(staffOrderService, 'list').mockResolvedValue(page([]))
    const { wrapper } = await mountAt(StaffOrdersView, '/staff/orders', { user: USERS.staff })
    await flushPromises()
    expect(wrapper.text()).toContain('No order matches these filters.')
  })

  it('offers a retry when the list fails', async () => {
    vi.spyOn(staffOrderService, 'list').mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountAt(StaffOrdersView, '/staff/orders', { user: USERS.staff })
    await flushPromises()
    expect(wrapper.text()).toContain('Could not load orders.')
    expect(wrapper.findAll('button').some((b) => b.text() === 'Try again')).toBe(true)
  })

  it('refreshes when tick is called and the page is visible', async () => {
    const spy = vi.spyOn(staffOrderService, 'list').mockResolvedValue(page([ORDER]))
    const { wrapper } = await mountAt(StaffOrdersView, '/staff/orders', { user: USERS.staff })
    await flushPromises()
    expect(spy).toHaveBeenCalledTimes(1)
    Object.defineProperty(document, 'hidden', { value: false, configurable: true })
    wrapper.vm.tick()
    await flushPromises()
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
