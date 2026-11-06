import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import StaffPaymentsView from '../../../src/views/staff/StaffPaymentsView.vue'
import staffPaymentService from '../../../src/services/staffPaymentService'

const CASH = { id: 3, order: 9, method: 'cash', amount: '12.50', status: 'pending', reference: 'PAY-3', paid_at: null, created_at: '2026-11-05T18:00:00Z', currency: 'USD' }
const CARD = { ...CASH, id: 4, method: 'card', status: 'paid', reference: 'PAY-4' }
const PAGE = (results) => ({ count: results.length, next: null, previous: null, results })

describe('StaffPaymentsView', () => {
  it('lists payments and offers confirmation only for pending cash', async () => {
    vi.spyOn(staffPaymentService, 'list').mockResolvedValue(PAGE([CASH, CARD]))
    const { wrapper } = await mountAt(StaffPaymentsView, '/staff/payments', { user: USERS.staff })
    await flushPromises()
    expect(wrapper.text()).toContain('PAY-3')
    expect(wrapper.text()).toContain('PAY-4')
    expect(wrapper.findAll('button').filter((b) => b.text() === 'Confirm cash')).toHaveLength(1)
  })

  it('confirms a cash payment and reloads', async () => {
    const list = vi.spyOn(staffPaymentService, 'list').mockResolvedValue(PAGE([CASH]))
    const confirm = vi.spyOn(staffPaymentService, 'confirm').mockResolvedValue({ ...CASH, status: 'paid' })
    const { wrapper } = await mountAt(StaffPaymentsView, '/staff/payments', { user: USERS.staff })
    await flushPromises()
    await wrapper.findAll('button').find((b) => b.text() === 'Confirm cash').trigger('click')
    await flushPromises()
    expect(confirm).toHaveBeenCalledWith(3)
    expect(list).toHaveBeenCalledTimes(2)
  })

  it('passes the filters to the service', async () => {
    const spy = vi.spyOn(staffPaymentService, 'list').mockResolvedValue(PAGE([]))
    await mountAt(StaffPaymentsView, '/staff/payments?search=PAY&status=paid&method=card', { user: USERS.staff })
    await flushPromises()
    expect(spy).toHaveBeenCalledWith({ page: 1, page_size: 20, search: 'PAY', status: 'paid', method: 'card' })
  })
})
