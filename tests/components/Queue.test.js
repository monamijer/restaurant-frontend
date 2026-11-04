import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { queueService } from '@/services/queueService'
import { useToastStore } from '@/store/toasts'
import { ApiError } from '@/utils/errors'
import QueueView from '@/views/QueueView.vue'
import { makeTicket } from '../helpers/fixtures'
import { mountAt, USERS } from '../helpers/app'

const button = (wrapper, text) => wrapper.findAll('button').find((candidate) => candidate.text() === text)

function open({ user = USERS.client, summary = { waiting: 3, estimated_wait_minutes: 20 }, tickets = [] } = {}) {
  vi.spyOn(queueService, 'summary').mockResolvedValue(summary)
  vi.spyOn(queueService, 'mine').mockResolvedValue(tickets)
  return mountAt(QueueView, '/queue', { user })
}

describe('the summary', () => {
  it('tells everyone how many wait and for how long', async () => {
    const { wrapper } = await open({ user: null })

    expect(wrapper.get('.summary').text()).toContain('3 parties waiting')
    expect(wrapper.get('.summary').text()).toContain('About 20 minutes for a party arriving now')
  })

  it('says "1 party" and "no wait" in their own words', async () => {
    const one = await open({ user: null, summary: { waiting: 1, estimated_wait_minutes: 10 } })
    const none = await open({ user: null, summary: { waiting: 0, estimated_wait_minutes: 0 } })

    expect(one.wrapper.get('.summary').text()).toContain('1 party waiting')
    expect(none.wrapper.get('.summary').text()).toContain('No wait right now')
  })

  it('reports a failure and can retry', async () => {
    const summary = vi.spyOn(queueService, 'summary')
    summary.mockRejectedValueOnce(new ApiError({ status: 0, code: 'NETWORK_ERROR' })).mockResolvedValue({ waiting: 2, estimated_wait_minutes: 15 })
    vi.spyOn(queueService, 'mine').mockResolvedValue([])
    const { wrapper } = await mountAt(QueueView, '/queue', { user: USERS.client })

    expect(wrapper.get('.summary').text()).toContain('The queue could not be loaded.')
    await button(wrapper, 'Try again').trigger('click')
    await flushPromises()

    expect(wrapper.get('.summary').text()).toContain('2 parties waiting')
  })
})

describe('a visitor', () => {
  it('is asked to sign in, and brought back here', async () => {
    const { wrapper } = await open({ user: null })

    expect(queueService.mine).not.toHaveBeenCalled()
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.get('a[href^="/login"]').attributes('href')).toBe('/login?redirect=/queue')
  })
})

describe('joining', () => {
  it('joins with the party size and phone, then shows the place in line', async () => {
    const join = vi.spyOn(queueService, 'join').mockResolvedValue(makeTicket())
    const { wrapper } = await open()
    queueService.mine.mockResolvedValue([makeTicket()]) // From now on the server knows the ticket.

    await wrapper.get('#queue-party').setValue('3')
    await wrapper.get('input[name="phone"]').setValue(' +25779000001 ')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(join).toHaveBeenCalledWith({ partySize: 3, phone: '+25779000001' })
    expect(useToastStore().items.map((toast) => toast.message)).toEqual(['You are in the queue.'])
    expect(wrapper.find('.ticket').exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('starts the phone from the account when there is one', async () => {
    const { wrapper } = await open({ user: USERS.staff })

    expect(wrapper.get('input[name="phone"]').element.value).toBe('+25779000002')
  })

  it('shows the server message when joining is refused', async () => {
    vi.spyOn(queueService, 'join').mockRejectedValue(
      new ApiError({ status: 409, code: 'CONFLICT', message: 'You already have an active ticket.' }),
    )
    const { wrapper } = await open()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('You already have an active ticket.')
  })

  it('cannot join twice with a double click', async () => {
    let finish
    const join = vi.spyOn(queueService, 'join').mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const { wrapper } = await open()

    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')
    finish(makeTicket())
    await flushPromises()

    expect(join).toHaveBeenCalledTimes(1)
  })
})

describe('a ticket', () => {
  it('shows the position, the people ahead and the wait', async () => {
    const { wrapper } = await open({ tickets: [makeTicket()] })

    const ticket = wrapper.get('.ticket').text()
    expect(ticket).toContain('Waiting')
    expect(ticket).toContain('Position 3')
    expect(ticket).toContain('2 parties ahead of you')
    expect(ticket).toContain('About 20 minutes')
    expect(ticket).toContain('Quoted when you joined: 25 minutes')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('says "you are next" at the front of the line', async () => {
    const { wrapper } = await open({ tickets: [makeTicket({ position: 1 })] })

    expect(wrapper.get('.ticket').text()).toContain('You are next.')
  })

  it('announces clearly when the table is ready', async () => {
    const { wrapper } = await open({ tickets: [makeTicket({ status: 'called', position: 1 })] })

    expect(wrapper.get('.ticket__called').text()).toBe('It is your turn! Please come to the host.')
    expect(wrapper.get('.ticket').classes()).toContain('ticket--called')
    expect(wrapper.get('.ticket').text()).not.toContain('Position')
  })

  it('ignores tickets that are over', async () => {
    const { wrapper } = await open({ tickets: [makeTicket({ status: 'seated' }), makeTicket({ id: 2, status: 'cancelled' })] })

    expect(wrapper.find('.ticket').exists()).toBe(false)
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('leaves the queue after confirmation', async () => {
    const cancel = vi.spyOn(queueService, 'cancel').mockResolvedValue(makeTicket({ status: 'cancelled' }))
    const { wrapper } = await open({ tickets: [makeTicket()] })
    queueService.mine.mockResolvedValue([makeTicket({ status: 'cancelled' })])

    await button(wrapper, 'Leave the queue').trigger('click')
    await button(wrapper, 'Yes, leave').trigger('click')
    await flushPromises()

    expect(cancel).toHaveBeenCalledWith(4)
    expect(useToastStore().items.map((toast) => toast.message)).toEqual(['You left the queue.'])
    expect(wrapper.find('.ticket').exists()).toBe(false)
  })

  it('stays in line when the visitor changes their mind', async () => {
    const cancel = vi.spyOn(queueService, 'cancel')
    const { wrapper } = await open({ tickets: [makeTicket()] })

    await button(wrapper, 'Leave the queue').trigger('click')
    await button(wrapper, 'Stay in line').trigger('click')

    expect(cancel).not.toHaveBeenCalled()
    expect(wrapper.find('.ticket').exists()).toBe(true)
  })
})

describe('staying up to date', () => {
  it('refreshes on its own, except while the tab is hidden', async () => {
    const { wrapper } = await open({ tickets: [makeTicket()] })
    queueService.summary.mockClear()

    wrapper.vm.tick()
    expect(queueService.summary).toHaveBeenCalledTimes(1)

    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    wrapper.vm.tick()
    expect(queueService.summary).toHaveBeenCalledTimes(1)
  })

  it('moves forward in the line without a reload', async () => {
    const { wrapper } = await open({ tickets: [makeTicket({ position: 3 })] })
    queueService.mine.mockResolvedValue([makeTicket({ position: 2 })])

    wrapper.vm.tick()
    await flushPromises()

    expect(wrapper.get('.ticket__position').text()).toBe('Position 2')
  })

  it('keeps what is shown when a refresh fails', async () => {
    const { wrapper } = await open({ tickets: [makeTicket()] })
    queueService.summary.mockRejectedValue(new ApiError({ status: 0, code: 'NETWORK_ERROR' }))
    queueService.mine.mockRejectedValue(new ApiError({ status: 0, code: 'NETWORK_ERROR' }))

    wrapper.vm.tick()
    await flushPromises()

    expect(wrapper.get('.ticket__position').text()).toBe('Position 3')
    expect(wrapper.get('.summary').text()).toContain('3 parties waiting')
  })

  it('stops its timer when the page is left', async () => {
    const clear = vi.spyOn(globalThis, 'clearInterval')
    const { wrapper } = await open()

    wrapper.unmount()

    expect(clear).toHaveBeenCalled()
  })
})
