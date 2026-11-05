import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import StaffQueueView from '../../../src/views/staff/StaffQueueView.vue'
import { staffQueueService } from '../../../src/services/staffQueueService'

const WAITING = {
  id: 4, party_size: 3, phone: '+25779000004',
  status: 'waiting', position: 2, estimated_wait_minutes: 15, quoted_wait_minutes: 15,
  created_at: '2026-11-05T10:00:00Z',
}
const CALLED = { ...WAITING, id: 5, status: 'called', position: 1 }

const PAGE = (results) => ({ count: results.length, next: null, previous: null, results })

function stub(list = [WAITING, CALLED]) {
  vi.spyOn(staffQueueService, 'list').mockResolvedValue(PAGE(list))
}

describe('StaffQueueView', () => {
  it('lists the tickets with the actions of their status', async () => {
    stub()
    const { wrapper } = await mountAt(StaffQueueView, '/staff/queue', { user: USERS.staff })
    await flushPromises()
    const rows = wrapper.findAll('.card')
    expect(rows).toHaveLength(2)

    const waiting = rows[0].text()
    expect(waiting).toContain('3 guests')
    expect(waiting).toContain('Position 2')
    expect(waiting).toContain('Call')
    expect(waiting).toContain('Cancel')
    expect(waiting).not.toContain('No-show')

    const called = rows[1].text()
    expect(called).toContain('Position 1')
    expect(called).toContain('Seat')
    expect(called).toContain('No-show')
  })

  it('calls the next waiting party', async () => {
    stub()
    vi.spyOn(staffQueueService, 'callNext').mockResolvedValue(CALLED)
    const { wrapper } = await mountAt(StaffQueueView, '/staff/queue', { user: USERS.staff })
    await flushPromises()
    const callNext = wrapper.findAll('button').find((b) => b.text() === 'Call next')
    await callNext.trigger('click')
    await flushPromises()
    expect(staffQueueService.callNext).toHaveBeenCalled()
  })

  it('asks for a confirmation before a no-show', async () => {
    stub([CALLED])
    vi.spyOn(staffQueueService, 'noShow').mockResolvedValue({ ...CALLED, status: 'no_show' })
    const { wrapper } = await mountAt(StaffQueueView, '/staff/queue', { user: USERS.staff })
    await flushPromises()
    const noShow = wrapper.findAll('button').find((b) => b.text() === 'No-show')
    await noShow.trigger('click')
    await flushPromises()
    expect(staffQueueService.noShow).not.toHaveBeenCalled()
    const dialogConfirm = wrapper.findAll('footer button').find((b) => b.text() === 'Yes, mark as no-show')
    await dialogConfirm.trigger('click')
    await flushPromises()
    expect(staffQueueService.noShow).toHaveBeenCalledWith(5)
  })

  it('passes the filters to the service', async () => {
    const spy = vi.spyOn(staffQueueService, 'list').mockResolvedValue(PAGE([]))
    await mountAt(StaffQueueView, '/staff/queue?status=waiting&active=1', { user: USERS.staff })
    await flushPromises()
    expect(spy).toHaveBeenCalledWith({ page: 1, page_size: 20, status: 'waiting', active: true })
  })

  it('offers a retry when the list fails', async () => {
    vi.spyOn(staffQueueService, 'list').mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountAt(StaffQueueView, '/staff/queue', { user: USERS.staff })
    await flushPromises()
    expect(wrapper.text()).toContain('Could not load the queue.')
    expect(wrapper.findAll('button').some((b) => b.text() === 'Try again')).toBe(true)
  })
})
