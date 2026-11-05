import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import StaffReservationsView from '../../../src/views/staff/StaffReservationsView.vue'
import { staffReservationService } from '../../../src/services/staffReservationService'

const PENDING = {
  id: 7,
  customer: 'Ada',
  table_number: '5',
  date: '2026-11-05',
  time: '19:00',
  duration_minutes: 90,
  party_size: 4,
  status: 'pending',
}

const PAGE = (results) => ({ count: results.length, next: null, previous: null, results })

function stub(list = [PENDING]) {
  vi.spyOn(staffReservationService, 'list').mockResolvedValue(PAGE(list))
}

describe('StaffReservationsView', () => {
  it('lists the reservations with the actions available for their status', async () => {
    stub()
    const { wrapper } = await mountAt(StaffReservationsView, '/staff/reservations', { user: USERS.staff })
    await flushPromises()
    const text = wrapper.text()
    expect(text).toContain('Ada')
    expect(text).toContain('Confirm')
    expect(text).toContain('Reject')
    expect(text).not.toContain('No-show')
  })

  it('calls confirm on the service and refreshes', async () => {
    stub()
    vi.spyOn(staffReservationService, 'act').mockResolvedValue({ ...PENDING, status: 'confirmed' })
    const { wrapper } = await mountAt(StaffReservationsView, '/staff/reservations', { user: USERS.staff })
    await flushPromises()
    const confirm = wrapper.findAll('button').find((b) => b.text() === 'Confirm')
    await confirm.trigger('click')
    await flushPromises()
    expect(staffReservationService.act).toHaveBeenCalledWith(7, 'confirm')
  })

  it('passes the filters to the service', async () => {
    const spy = vi.spyOn(staffReservationService, 'list').mockResolvedValue(PAGE([]))
    await mountAt(StaffReservationsView, '/staff/reservations?status=confirmed&date=2026-11-05', { user: USERS.staff })
    await flushPromises()
    expect(spy).toHaveBeenCalledWith({ page: 1, page_size: 20, status: 'confirmed', date: '2026-11-05' })
  })

  it('offers a retry when the list fails', async () => {
    vi.spyOn(staffReservationService, 'list').mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountAt(StaffReservationsView, '/staff/reservations', { user: USERS.staff })
    await flushPromises()
    expect(wrapper.text()).toContain('Could not load reservations.')
    expect(wrapper.findAll('button').some((b) => b.text() === 'Try again')).toBe(true)
  })
})
