import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import StaffOrderView from '../../../src/views/staff/StaffOrderView.vue'
import staffOrderService from '../../../src/services/staffOrderService'
import staffPaymentService from '../../../src/services/staffPaymentService'
import { invoiceService } from '../../../src/services/invoiceService'

const ORDER = {
  id: 42,
  customer_name: 'Ada',
  order_type: 'dine_in',
  status: 'pending',
  table_number: '5',
  contact_phone: '',
  delivery_address: '',
  notes: '',
  items: [
    { id: 1, item_name: 'Pasta', quantity: 2, unit_price: '12.50', subtotal: '25.00', special_instructions: '' },
  ],
  subtotal: '25.00',
  tax_rate: '10.00',
  tax_amount: '2.50',
  total: '27.50',
  created_at: '2026-10-10T17:00:00Z',
  updated_at: '2026-10-10T17:00:00Z',
}

const PAYMENTS_PAGE = (results) => ({ count: results.length, next: null, previous: null, results })

function stub({ order = ORDER, payments = [], invoice = null } = {}) {
  vi.spyOn(staffOrderService, 'get').mockResolvedValue(order)
  vi.spyOn(staffPaymentService, 'listForOrder').mockResolvedValue(PAYMENTS_PAGE(payments))
  vi.spyOn(invoiceService, 'forOrder').mockResolvedValue(invoice)
}

describe('StaffOrderView', () => {
  it('shows the order with items, totals and the next action', async () => {
    stub()
    const { wrapper } = await mountAt(StaffOrderView, '/staff/orders/42', { user: USERS.staff })
    await flushPromises()
    expect(wrapper.text()).toContain('Order #42')
    expect(wrapper.text()).toContain('Pasta')
    expect(wrapper.text()).toContain('$27.50')
    expect(wrapper.findAll('button').some((b) => b.text().includes('Confirmed'))).toBe(true)
  })

  it('advances the status with the next step only', async () => {
    stub()
    vi.spyOn(staffOrderService, 'updateStatus').mockResolvedValue({ ...ORDER, status: 'confirmed' })
    const { wrapper } = await mountAt(StaffOrderView, '/staff/orders/42', { user: USERS.staff })
    await flushPromises()
    const button = wrapper.findAll('button').find((b) => b.text().includes('Confirmed'))
    await button.trigger('click')
    await flushPromises()
    expect(staffOrderService.updateStatus).toHaveBeenCalledWith(42, 'confirmed')
  })

  it('does not show an advance button on a completed order', async () => {
    stub({ order: { ...ORDER, status: 'completed' } })
    const { wrapper } = await mountAt(StaffOrderView, '/staff/orders/42', { user: USERS.staff })
    await flushPromises()
    expect(wrapper.findAll('button').some((b) => /Confirmed|Preparing|Ready/.test(b.text()))).toBe(false)
  })

  it('confirms a pending cash payment after a confirmation dialog', async () => {
    stub({ payments: [{ id: 12, method: 'cash', status: 'pending' }] })
    vi.spyOn(staffPaymentService, 'confirm').mockResolvedValue({ id: 12, status: 'paid' })
    const { wrapper } = await mountAt(StaffOrderView, '/staff/orders/42', { user: USERS.staff })
    await flushPromises()
    const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('Confirm cash'))
    await confirmButton.trigger('click')
    const dialogConfirm = wrapper.findAll('footer button').find((b) => b.text() === 'Confirm')
    await dialogConfirm.trigger('click')
    await flushPromises()
    expect(staffPaymentService.confirm).toHaveBeenCalledWith(12)
  })

  it('reports a not-found order', async () => {
    vi.spyOn(staffOrderService, 'get').mockRejectedValue({ status: 404 })
    vi.spyOn(staffPaymentService, 'listForOrder').mockResolvedValue(PAYMENTS_PAGE([]))
    vi.spyOn(invoiceService, 'forOrder').mockResolvedValue(null)
    const { wrapper } = await mountAt(StaffOrderView, '/staff/orders/999', { user: USERS.staff })
    await flushPromises()
    expect(wrapper.text()).toContain('Order not found')
  })
})
