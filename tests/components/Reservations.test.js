import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { reservationService } from '@/services/reservationService'
import { useRestaurantStore } from '@/store/restaurant'
import { useToastStore } from '@/store/toasts'
import { ApiError } from '@/utils/errors'
import { todayIn } from '@/utils/format'
import ReservationNewView from '@/views/ReservationNewView.vue'
import ReservationsView from '@/views/ReservationsView.vue'
import { makeReservation, page, SETTINGS } from '../helpers/fixtures'
import { mountAt, USERS } from '../helpers/app'

const button = (wrapper, text) => wrapper.findAll('button').find((candidate) => candidate.text() === text)
const TABLES = [
  { id: 1, number: 1, capacity: 6, location: 'Terrace' },
  { id: 2, number: 2, capacity: 2, location: 'Window' },
]
const SLOTS = { slots: [{ starts_at: '2099-01-01T19:00:00Z', time: '19:00', tables: TABLES }, { starts_at: '2099-01-01T19:30:00Z', time: '19:30', tables: [TABLES[0]] }] }

function booking() {
  return mountAt(ReservationNewView, '/reservations/new', {
    user: USERS.client,
    before: () => (useRestaurantStore().settings = SETTINGS),
  })
}

async function search(wrapper) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('ReservationNewView', () => {
  it('starts today, for two guests and ninety minutes', async () => {
    const { wrapper } = await booking()

    expect(wrapper.get('input[name="date"]').element.value).toBe(todayIn('UTC'))
    expect(wrapper.get('#party-size').element.value).toBe('2')
    expect(wrapper.get('#duration').element.value).toBe('90')
    expect(wrapper.findAll('#duration option').map((option) => option.text())).toEqual([
      '60 minutes',
      '90 minutes',
      '120 minutes',
      '150 minutes',
      '180 minutes',
    ])
  })

  it('looks up the free times for what was asked', async () => {
    const availability = vi.spyOn(reservationService, 'availability').mockResolvedValue(SLOTS)
    const { wrapper } = await booking()

    await wrapper.get('input[name="date"]').setValue('2099-01-01')
    await wrapper.get('#party-size').setValue('4')
    await search(wrapper)

    expect(availability).toHaveBeenCalledWith({ date: '2099-01-01', partySize: 4, duration: 90 })
    expect(wrapper.findAll('.slot').map((slot) => slot.text())).toEqual(['19:00', '19:30'])
  })

  it('refuses a past date without calling the server', async () => {
    const availability = vi.spyOn(reservationService, 'availability')
    const { wrapper } = await booking()

    await wrapper.get('input[name="date"]').setValue('2020-01-01')
    await search(wrapper)

    expect(availability).not.toHaveBeenCalled()
    expect(wrapper.get('.field__error').text()).toBe('Choose today or a later date.')
  })

  it('says when nothing is free', async () => {
    vi.spyOn(reservationService, 'availability').mockResolvedValue({ slots: [] })
    const { wrapper } = await booking()

    await search(wrapper)

    expect(wrapper.text()).toContain('Nothing available')
    expect(wrapper.find('.slot').exists()).toBe(false)
  })

  it('suggests the smallest table that fits and lets the guest choose another', async () => {
    vi.spyOn(reservationService, 'availability').mockResolvedValue(SLOTS)
    const { wrapper } = await booking()
    await search(wrapper)

    await wrapper.findAll('.slot')[0].trigger('click')

    expect(wrapper.get('#table').element.value).toBe('2')
    expect(wrapper.findAll('#table option').map((option) => option.text().replace(/\s+/g, ' '))).toEqual([
      'Table 1 · up to 6 guests · Terrace',
      'Table 2 · up to 2 guests · Window',
    ])
    expect(wrapper.get('.slot--active').text()).toBe('19:00')
    expect(wrapper.get('.booking__summary').text()).toContain('at 19:00, 2 guests')
  })

  it('does not ask which table when only one fits', async () => {
    vi.spyOn(reservationService, 'availability').mockResolvedValue(SLOTS)
    const { wrapper } = await booking()
    await search(wrapper)

    await wrapper.findAll('.slot')[1].trigger('click')

    expect(wrapper.find('#table').exists()).toBe(false)
  })

  it('requests the chosen table and goes to the reservations', async () => {
    vi.spyOn(reservationService, 'availability').mockResolvedValue(SLOTS)
    const create = vi.spyOn(reservationService, 'create').mockResolvedValue(makeReservation({ status: 'pending' }))
    const { wrapper, router } = await booking()
    await wrapper.get('input[name="date"]').setValue('2099-01-01')
    await search(wrapper)
    await wrapper.findAll('.slot')[0].trigger('click')
    await wrapper.get('input[name="notes"]').setValue(' Birthday ')

    await wrapper.findAll('form')[1].trigger('submit')
    await flushPromises()

    expect(create).toHaveBeenCalledWith({
      table: 2,
      date: '2099-01-01',
      time: '19:00',
      duration_minutes: 90,
      party_size: 2,
      notes: 'Birthday',
    })
    expect(useToastStore().items.map((toast) => toast.message)).toEqual([
      'Reservation requested. The restaurant will confirm it shortly.',
    ])
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('reservations'))
  })

  it('forgets the times found when the search changes', async () => {
    vi.spyOn(reservationService, 'availability').mockResolvedValue(SLOTS)
    const { wrapper } = await booking()
    await search(wrapper)
    expect(wrapper.find('.slot').exists()).toBe(true)

    await wrapper.get('#party-size').setValue('6')

    expect(wrapper.find('.slot').exists()).toBe(false)
  })

  it('refreshes the times and says so when somebody took the table first', async () => {
    const availability = vi.spyOn(reservationService, 'availability').mockResolvedValue(SLOTS)
    vi.spyOn(reservationService, 'create').mockRejectedValue(new ApiError({ status: 409, code: 'CONFLICT' }))
    const { wrapper } = await booking()
    await search(wrapper)
    await wrapper.findAll('.slot')[0].trigger('click')

    await wrapper.findAll('form')[1].trigger('submit')
    await flushPromises()

    expect(availability).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[role="alert"]').text()).toContain('That table was just taken')
    expect(wrapper.find('form + section form').exists()).toBe(false)
  })

  it('shows the server messages next to the fields', async () => {
    vi.spyOn(reservationService, 'availability').mockResolvedValue(SLOTS)
    vi.spyOn(reservationService, 'create').mockRejectedValue(
      new ApiError({ status: 400, code: 'VALIDATION_ERROR', errors: { notes: ['Too long.'] } }),
    )
    const { wrapper } = await booking()
    await search(wrapper)
    await wrapper.findAll('.slot')[0].trigger('click')

    await wrapper.findAll('form')[1].trigger('submit')
    await flushPromises()

    expect(wrapper.get('.field__error').text()).toBe('Too long.')
  })

  it('cannot be submitted twice', async () => {
    vi.spyOn(reservationService, 'availability').mockResolvedValue(SLOTS)
    let finish
    const create = vi.spyOn(reservationService, 'create').mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const { wrapper } = await booking()
    await search(wrapper)
    await wrapper.findAll('.slot')[0].trigger('click')

    await wrapper.findAll('form')[1].trigger('submit')
    await wrapper.findAll('form')[1].trigger('submit')
    finish(makeReservation())
    await flushPromises()

    expect(create).toHaveBeenCalledTimes(1)
  })
})

describe('ReservationsView', () => {
  const list = (results, count = results.length) => vi.spyOn(reservationService, 'list').mockResolvedValue(page(results, count))
  const open = (before) => mountAt(ReservationsView, '/reservations', { user: USERS.client, before })

  it('lists the bookings with day, time, guests, table and status', async () => {
    list([makeReservation(), makeReservation({ id: 6, status: 'rejected', table_number: 7, party_size: 1 })])
    const { wrapper } = await open()

    const rows = wrapper.findAll('.row')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Saturday, October 10, 2026 · 19:00')
    expect(rows[0].text()).toContain('4 guests')
    expect(rows[0].text()).toContain('Table 3')
    expect(rows[0].text()).toContain('Confirmed')
    expect(rows[1].text()).toContain('1 guest')
    expect(rows[1].text()).toContain('Declined')
  })

  it('tells a pending request how long it is held', async () => {
    list([makeReservation({ status: 'pending', expires_at: '2026-10-10T18:30:00Z' })])
    const { wrapper } = await open((() => (useRestaurantStore().settings = SETTINGS)))

    expect(wrapper.text()).toContain('Awaiting confirmation')
    expect(wrapper.text()).toContain('Held until 06:30 PM while the restaurant decides.')
  })

  it('only offers to cancel an open booking', async () => {
    list([makeReservation({ status: 'confirmed' }), makeReservation({ id: 6, status: 'completed' }), makeReservation({ id: 7, status: 'cancelled' })])
    const { wrapper } = await open()

    expect(wrapper.findAll('.row').map((row) => row.findAll('button').length)).toEqual([1, 0, 0])
  })

  it('cancels after confirmation and reloads the list', async () => {
    const reload = list([makeReservation()])
    const cancel = vi.spyOn(reservationService, 'cancel').mockResolvedValue(makeReservation({ status: 'cancelled' }))
    const { wrapper } = await open()

    await wrapper.get('.row button').trigger('click')
    await button(wrapper, 'Yes, cancel it').trigger('click')
    await flushPromises()

    expect(cancel).toHaveBeenCalledWith(5)
    expect(reload).toHaveBeenCalledTimes(2)
    expect(useToastStore().items.map((toast) => toast.message)).toEqual(['Reservation cancelled.'])
  })

  it('keeps the booking when the visitor changes their mind', async () => {
    list([makeReservation()])
    const cancel = vi.spyOn(reservationService, 'cancel')
    const { wrapper } = await open()

    await wrapper.get('.row button').trigger('click')
    await button(wrapper, 'Keep it').trigger('click')

    expect(cancel).not.toHaveBeenCalled()
  })

  it('shows the server message when cancelling is refused', async () => {
    list([makeReservation()])
    vi.spyOn(reservationService, 'cancel').mockRejectedValue(
      new ApiError({ status: 409, code: 'CONFLICT', message: 'Too late to cancel.' }),
    )
    const { wrapper } = await open()

    await wrapper.get('.row button').trigger('click')
    await button(wrapper, 'Yes, cancel it').trigger('click')
    await flushPromises()

    expect(useToastStore().items.map((toast) => toast.message)).toEqual(['Too late to cancel.'])
  })

  it('invites the first booking, reports failures and pages through the list', async () => {
    const spy = list([], 0)
    const empty = await open()
    expect(empty.wrapper.text()).toContain('No reservations yet')
    expect(empty.wrapper.findAll('a[href="/reservations/new"]').length).toBeGreaterThan(0)

    spy.mockRejectedValueOnce(new ApiError({ status: 0, code: 'NETWORK_ERROR' }))
    const failed = await open()
    expect(failed.wrapper.text()).toContain('Your reservations could not be loaded.')

    spy.mockResolvedValue(page([makeReservation()], 25))
    const paged = await open()
    await paged.wrapper.findAll('nav button')[1].trigger('click')
    await flushPromises()
    expect(paged.router.currentRoute.value.query).toEqual({ page: '2' })
    expect(spy).toHaveBeenLastCalledWith({ page: 2, page_size: 10, ordering: '-starts_at' })
  })
})
