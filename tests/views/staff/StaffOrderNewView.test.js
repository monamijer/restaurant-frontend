import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import StaffOrderNewView from '../../../src/views/staff/StaffOrderNewView.vue'
import staffOrderService from '../../../src/services/staffOrderService'
import { menuService } from '../../../src/services/menuService'
import { staffTableService } from '../../../src/services/staffTableService'

const MENU = {
  count: 2, next: null, previous: null, results: [
    { id: 1, name: 'Pasta', price: '12.50' },
    { id: 2, name: 'Pizza', price: '9.00' },
  ],
}
const TABLES = { count: 1, next: null, previous: null, results: [{ id: 3, number: '5', location: 'patio' }] }

function stub() {
  vi.spyOn(menuService, 'items').mockResolvedValue(MENU)
  vi.spyOn(staffTableService, 'list').mockResolvedValue(TABLES)
  vi.spyOn(staffOrderService, 'create').mockResolvedValue({ id: 99, status: 'pending' })
}

describe('StaffOrderNewView', () => {
  it('lists the available dishes', async () => {
    stub()
    const { wrapper } = await mountAt(StaffOrderNewView, '/staff/orders/new', { user: USERS.staff })
    await flushPromises()
    const names = wrapper.findAll('.menu-item__name').map((n) => n.text())
    expect(names).toEqual(['Pasta', 'Pizza'])
  })

  it('builds the payload with the lines and the table', async () => {
    stub()
    const { wrapper } = await mountAt(StaffOrderNewView, '/staff/orders/new', { user: USERS.staff })
    await flushPromises()

    const addButtons = wrapper.findAll('button').filter((b) => b.text() === 'Add')
    await addButtons[0].trigger('click')
    await addButtons[1].trigger('click')

    const tableSelect = wrapper.findAll('select')[1]
    await tableSelect.setValue('3')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(staffOrderService.create).toHaveBeenCalled()
    const payload = staffOrderService.create.mock.calls[0][0]
    expect(payload.order_type).toBe('dine_in')
    expect(payload.table).toBe(3)
    expect(payload.items).toHaveLength(2)
  })

  it('requires a table for a dine-in order', async () => {
    stub()
    const { wrapper } = await mountAt(StaffOrderNewView, '/staff/orders/new', { user: USERS.staff })
    await flushPromises()

    const addButtons = wrapper.findAll('button').filter((b) => b.text() === 'Add')
    await addButtons[0].trigger('click')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(staffOrderService.create).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('A table is required for dine-in.')
  })

  it('requires at least one dish', async () => {
    stub()
    const { wrapper } = await mountAt(StaffOrderNewView, '/staff/orders/new', { user: USERS.staff })
    await flushPromises()

    const tableSelect = wrapper.findAll('select')[1]
    await tableSelect.setValue('3')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(staffOrderService.create).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Add at least one dish.')
  })
})
