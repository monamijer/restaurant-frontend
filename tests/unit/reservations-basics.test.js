import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { invoiceService } from '@/services/invoiceService'
import { notificationService } from '@/services/notificationService'
import { queueService } from '@/services/queueService'
import { reservationService } from '@/services/reservationService'
import { session } from '@/services/session'
import { saveBlob } from '@/utils/download'
import { formatDay, todayIn } from '@/utils/format'
import {
  canCancelReservation,
  durationOptions,
  isActiveTicket,
  queueTone,
  reservationTone,
  smallestTable,
} from '@/utils/reservations'
import { fakeServer, reply } from '../helpers/http'

beforeEach(() => {
  session.clear()
})

describe('reservationService', () => {
  it('lists with the filters it is given', async () => {
    let params
    fakeServer((config) => {
      params = config.params
      return reply(config, 200, { count: 0, results: [] })
    })

    await reservationService.list({ page: 2, page_size: 10, ordering: '-starts_at' })

    expect(params).toEqual({ page: 2, page_size: 10, ordering: '-starts_at' })
  })

  it('asks for availability with the backend parameter names', async () => {
    let seen
    fakeServer((config) => {
      seen = [config.url, config.params]
      return reply(config, 200, { slots: [] })
    })

    await reservationService.availability({ date: '2026-10-12', partySize: 4, duration: 90 })

    expect(seen).toEqual(['/reservations/availability/', { date: '2026-10-12', party_size: 4, duration_minutes: 90 }])
  })

  it('creates and cancels', async () => {
    const requests = fakeServer((config) => reply(config, 201, { id: 5 }))

    await reservationService.create({ table: 3, date: '2026-10-12', time: '19:00' })
    await reservationService.cancel(5)

    expect(requests.map((request) => [request.method, request.url])).toEqual([
      ['post', '/reservations/'],
      ['post', '/reservations/5/cancel/'],
    ])
  })
})

describe('queueService', () => {
  it('reads the public summary without credentials', async () => {
    session.setTokens({ access: 'a1' })
    const requests = fakeServer((config) => reply(config, 200, { waiting: 3, estimated_wait_minutes: 20 }))

    const summary = await queueService.summary()

    expect(summary.waiting).toBe(3)
    expect(requests[0]).toMatchObject({ url: '/queue/summary/', auth: undefined })
  })

  it('reads the latest tickets of the customer', async () => {
    let params
    fakeServer((config) => {
      params = config.params
      return reply(config, 200, { count: 1, results: [{ id: 4, status: 'waiting' }] })
    })

    const tickets = await queueService.mine()

    expect(tickets).toEqual([{ id: 4, status: 'waiting' }])
    expect(params).toEqual({ ordering: '-pk', page_size: 5 })
  })

  it('joins, sending a phone only when there is one, and leaves', async () => {
    const requests = fakeServer((config) => reply(config, 201, { id: 4 }))

    await queueService.join({ partySize: 3, phone: '' })
    await queueService.join({ partySize: 2, phone: '+25779000001' })
    await queueService.cancel(4)

    expect(JSON.parse(requests[0].body)).toEqual({ party_size: 3 })
    expect(JSON.parse(requests[1].body)).toEqual({ party_size: 2, phone: '+25779000001' })
    expect(requests[2]).toMatchObject({ method: 'post', url: '/queue/4/cancel/' })
  })
})

describe('invoiceService', () => {
  it('finds the invoice of an order, or nothing while there is none', async () => {
    const answers = [[{ id: 1, invoice_number: 'INV-2026-000001' }], []]
    fakeServer((config) => reply(config, 200, { count: 1, results: answers.shift() }))

    expect((await invoiceService.forOrder(42)).invoice_number).toBe('INV-2026-000001')
    expect(await invoiceService.forOrder(43)).toBeNull()
  })

  it('downloads the PDF as a file, through the authenticated API', async () => {
    session.setTokens({ access: 'a1' })
    let responseType
    const requests = fakeServer((config) => {
      responseType = config.responseType
      return reply(config, 200, new Blob(['pdf']))
    })

    const blob = await invoiceService.downloadPdf(7)

    expect(blob).toBeInstanceOf(Blob)
    expect(responseType).toBe('blob')
    expect(requests[0]).toMatchObject({ url: '/invoices/7/download-pdf/', auth: 'Bearer a1' })
  })
})

describe('notificationService', () => {
  it('counts unread, marks one read and marks all read', async () => {
    const answers = { '/notifications/unread-count/': { unread: 3 }, '/notifications/9/mark-read/': { id: 9, is_read: true }, '/notifications/mark-all-read/': { updated: 3 } }
    fakeServer((config) => reply(config, 200, answers[config.url]))

    expect(await notificationService.unreadCount()).toBe(3)
    expect((await notificationService.markRead(9)).is_read).toBe(true)
    expect(await notificationService.markAllRead()).toBe(3)
  })
})

describe('days and dates', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('writes a calendar date as a readable day, without any time zone drift', () => {
    expect(formatDay('2026-10-10', 'en')).toBe('Saturday, October 10, 2026')
    expect(formatDay('2026-10-10', 'fr')).toBe('samedi 10 octobre 2026')
  })

  it.each(['', 'tomorrow', '2026-1-1', null])('shows nothing for %j', (value) => {
    expect(formatDay(value)).toBe('')
  })

  it("knows today's date in the restaurant's time zone, not the visitor's", () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-10T23:30:00Z'))

    expect(todayIn('UTC')).toBe('2026-10-10')
    expect(todayIn('Africa/Bujumbura')).toBe('2026-10-11')
  })

  it('falls back to the universal date for an unknown time zone', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-10T08:00:00Z'))

    expect(todayIn('Nowhere/Land')).toBe('2026-10-10')
  })
})

describe('reservation helpers', () => {
  it('gives each status a tone, and only lets a customer cancel an open booking', () => {
    expect(reservationTone('confirmed')).toBe('success')
    expect(reservationTone('rejected')).toBe('danger')
    expect(reservationTone('odd')).toBe('neutral')
    expect(['pending', 'confirmed'].every(canCancelReservation)).toBe(true)
    expect(['rejected', 'cancelled', 'completed', 'no_show'].some(canCancelReservation)).toBe(false)
  })

  it('offers durations from the minimum to the maximum along the slot grid', () => {
    expect(durationOptions({ min_reservation_minutes: 60, max_reservation_minutes: 180, slot_step_minutes: 30 })).toEqual([
      60, 90, 120, 150, 180,
    ])
  })

  it('falls back to sensible durations when the settings are missing or inconsistent', () => {
    expect(durationOptions(null)).toEqual([60, 90, 120])
    expect(durationOptions({ min_reservation_minutes: 120, max_reservation_minutes: 60, slot_step_minutes: 30 })).toEqual([60, 90, 120])
  })

  it('never offers more than twelve durations', () => {
    expect(durationOptions({ min_reservation_minutes: 10, max_reservation_minutes: 1000, slot_step_minutes: 10 })).toHaveLength(12)
  })

  it('picks the smallest table that fits, lowest number first', () => {
    const tables = [
      { id: 1, number: 1, capacity: 6 },
      { id: 2, number: 2, capacity: 2 },
      { id: 3, number: 3, capacity: 2 },
    ]

    expect(smallestTable(tables).id).toBe(2)
    expect(smallestTable([])).toBeNull()
  })

  it('knows which queue tickets are still active', () => {
    expect(isActiveTicket('waiting')).toBe(true)
    expect(isActiveTicket('called')).toBe(true)
    expect(isActiveTicket('seated')).toBe(false)
    expect(queueTone('called')).toBe('success')
    expect(queueTone('no_show')).toBe('danger')
  })
})

describe('saveBlob', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('offers the file to the browser under its name, then frees it', () => {
    vi.useFakeTimers()
    URL.createObjectURL = vi.fn(() => 'blob:fake')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      expect(this.download).toBe('INV-1.pdf')
      expect(this.href).toBe('blob:fake')
    })

    saveBlob(new Blob(['x']), 'INV-1.pdf')

    expect(click).toHaveBeenCalledOnce()
    expect(document.querySelector('a[download]')).toBeNull()
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake')
  })
})
