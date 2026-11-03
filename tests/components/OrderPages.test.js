import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PaymentPanel from '@/components/orders/PaymentPanel.vue'
import OrderTimeline from '@/components/orders/OrderTimeline.vue'
import TableBanner from '@/components/layout/TableBanner.vue'
import { orderService } from '@/services/orderService'
import { paymentService } from '@/services/paymentService'
import { useTableStore } from '@/store/table'
import { useToastStore } from '@/store/toasts'
import { ApiError } from '@/utils/errors'
import OrderView from '@/views/OrderView.vue'
import OrdersView from '@/views/OrdersView.vue'
import { makeOrder, makePayment, page } from '../helpers/fixtures'
import { mountAt, USERS } from '../helpers/app'

afterEach(() => {
  vi.restoreAllMocks()
})

const button = (wrapper, text) => wrapper.findAll('button').find((candidate) => candidate.text() === text)

describe('OrderTimeline', () => {
  it('marks finished steps and the current one for assistive technology', async () => {
    const { wrapper } = await mountAt(OrderTimeline, '/', { props: { status: 'preparing' } })

    const steps = wrapper.findAll('.timeline__step')
    expect(steps.map((step) => step.text().replace(/[✓\d]/g, '').trim())).toEqual([
      'Pending',
      'Confirmed',
      'Preparing',
      'Ready',
      'Completed',
    ])
    expect(steps.map((step) => step.attributes('aria-current'))).toEqual([undefined, undefined, 'step', undefined, undefined])
    expect(steps.filter((step) => step.classes().includes('timeline__step--done'))).toHaveLength(2)
  })
})

describe('TableBanner', () => {
  it('stays out of the way until a table is scanned', async () => {
    const { wrapper } = await mountAt(TableBanner, '/')

    expect(wrapper.find('.table-banner').exists()).toBe(false)
  })

  it('shows the table and lets the diner leave it', async () => {
    const { wrapper } = await mountAt(TableBanner, '/', {
      before: () => (useTableStore().table = { token: 't:1', id: 3, number: 5 }),
    })

    expect(wrapper.text()).toContain('You are at table 5')
    await button(wrapper, 'Leave this table').trigger('click')

    expect(useTableStore().isSeated).toBe(false)
    expect(wrapper.find('.table-banner').exists()).toBe(false)
  })
})

describe('PaymentPanel', () => {
  const panel = (payments = [], order = makeOrder()) =>
    mountAt(PaymentPanel, '/orders/42', { user: USERS.client, props: { order, payments } })

  it('offers the three methods, cash first, with the amount on the button', async () => {
    const { wrapper } = await panel()

    expect(wrapper.findAll('.method strong').map((label) => label.text())).toEqual(['Cash', 'Card', 'Mobile money'])
    expect(wrapper.get('input[value="cash"]').element.checked).toBe(true)
    expect(wrapper.get('button[type="submit"]').text()).toBe('Pay $34.10')
  })

  it('registers a cash payment without a token and explains what happens next', async () => {
    const pay = vi.spyOn(paymentService, 'pay').mockResolvedValue(makePayment({ method: 'cash', status: 'pending' }))
    const { wrapper } = await panel()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(pay).toHaveBeenCalledWith({ order: 42, method: 'cash', token: '' })
    expect(wrapper.emitted('changed')).toHaveLength(1)
    expect(useToastStore().items.map((toast) => toast.message)).toEqual([
      'Cash payment registered. Please pay at the restaurant.',
    ])
  })

  it('pays by card with a provider token and never an amount', async () => {
    const pay = vi.spyOn(paymentService, 'pay').mockResolvedValue(makePayment())
    const { wrapper } = await panel()

    await wrapper.get('input[value="card"]').setValue()
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(pay).toHaveBeenCalledWith({ order: 42, method: 'card', token: 'tok_demo_card' })
    expect(useToastStore().items.map((toast) => toast.message)).toEqual(['Payment received. Thank you!'])
  })

  it('can simulate a declined payment in development', async () => {
    const pay = vi.spyOn(paymentService, 'pay').mockResolvedValue(makePayment({ status: 'failed' }))
    const { wrapper } = await panel()

    await wrapper.get('input[value="mobile_money"]').setValue()
    expect(wrapper.text()).toContain('Demo mode')
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(pay).toHaveBeenCalledWith({ order: 42, method: 'mobile_money', token: 'tok_declined' })
  })

  it('shows a declined payment and lets the customer try again', async () => {
    const { wrapper } = await panel([makePayment({ status: 'failed' })])

    expect(wrapper.get('[role="alert"]').text()).toContain('Your payment was declined')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('shows a paid order with its date and reference, and no way to pay again', async () => {
    const { wrapper } = await panel([makePayment()])

    expect(wrapper.text()).toContain('Paid')
    expect(wrapper.text()).toContain('Reference PAY-AB12CD34')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('waits for staff on a pending cash payment and lets the customer change method', async () => {
    const cancel = vi.spyOn(paymentService, 'cancel').mockResolvedValue(makePayment({ status: 'failed' }))
    const { wrapper } = await panel([makePayment({ method: 'cash', status: 'pending', paid_at: null })])

    expect(wrapper.get('[role="status"]').text()).toContain('Waiting for the restaurant')
    await button(wrapper, 'Choose another method').trigger('click')
    await flushPromises()

    expect(cancel).toHaveBeenCalledWith(9)
    expect(wrapper.emitted('changed')).toHaveLength(1)
  })

  it('shows the backend message when the payment is refused', async () => {
    vi.spyOn(paymentService, 'pay').mockRejectedValue(
      new ApiError({ status: 409, code: 'CONFLICT', message: 'This order is already paid.' }),
    )
    const { wrapper } = await panel()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('This order is already paid.')
  })
})

describe('OrderView', () => {
  function load({ order = makeOrder(), payments = [] } = {}) {
    vi.spyOn(orderService, 'get').mockResolvedValue(order)
    vi.spyOn(paymentService, 'forOrder').mockResolvedValue(payments)
    return mountAt(OrderView, '/orders/42', { user: USERS.client })
  }

  it('shows the order as the server priced it', async () => {
    const { wrapper } = await load()

    expect(wrapper.get('h1').text()).toBe('Order #42')
    expect(wrapper.get('.eyebrow').text().replace(/\s+/g, ' ')).toBe('Eat here · Table 5')
    expect(wrapper.text()).toContain('Pending')
    const items = wrapper.findAll('.item').map((item) => item.text().replace(/\s+/g, ' '))
    expect(items[0]).toContain('2 × Grilled fish')
    expect(items[0]).toContain('$12.50 each')
    expect(items[0]).toContain('well done')
    expect(items[0]).toContain('$25.00')
    const totals = wrapper.findAll('.totals div').map((row) => [row.get('dt').text(), row.get('dd').text()])
    expect(totals).toEqual([
      ['Subtotal', '$31.00'],
      ['Tax (10%)', '$3.10'],
      ['Total', '$34.10'],
    ])
  })

  it('shows where the order is in the kitchen', async () => {
    const { wrapper } = await load({ order: makeOrder({ status: 'ready' }) })

    expect(wrapper.get('[aria-current="step"]').text()).toContain('Ready')
    expect(wrapper.text()).toContain('This page updates by itself.')
  })

  it('shows the delivery details when there are some', async () => {
    const { wrapper } = await load({
      order: makeOrder({ order_type: 'delivery', table_number: null, delivery_address: '12 Rue du Lac', contact_phone: '+25779000001', notes: 'Ring twice' }),
    })

    const details = wrapper.get('.details').text()
    expect(details).toContain('12 Rue du Lac')
    expect(details).toContain('+25779000001')
    expect(details).toContain('Ring twice')
  })

  it('shows a payment panel and, while pending and unpaid, a way to cancel', async () => {
    const { wrapper } = await load()

    expect(wrapper.find('.payment').exists()).toBe(true)
    expect(button(wrapper, 'Cancel order')).toBeDefined()
  })

  it.each([
    ['an order the kitchen has started', { order: makeOrder({ status: 'preparing' }) }],
    ['a paid order', { payments: [makePayment()] }],
  ])('cannot be cancelled by the customer for %s', async (_label, options) => {
    const { wrapper } = await load(options)

    expect(button(wrapper, 'Cancel order')).toBeUndefined()
  })

  it('cancels after confirmation and shows the new state', async () => {
    const cancel = vi.spyOn(orderService, 'cancel').mockResolvedValue(makeOrder({ status: 'cancelled' }))
    const { wrapper } = await load()
    orderService.get.mockResolvedValue(makeOrder({ status: 'cancelled' }))

    await button(wrapper, 'Cancel order').trigger('click')
    await button(wrapper, 'Yes, cancel it').trigger('click')
    await flushPromises()

    expect(cancel).toHaveBeenCalledWith(42)
    expect(useToastStore().items.map((toast) => toast.message)).toEqual(['Order cancelled.'])
    expect(wrapper.get('.order__cancelled').text()).toBe('This order was cancelled.')
    expect(wrapper.find('.payment').exists()).toBe(false)
    expect(wrapper.find('.timeline').exists()).toBe(false)
  })

  it('keeps the order and shows the server message when cancelling is refused', async () => {
    vi.spyOn(orderService, 'cancel').mockRejectedValue(
      new ApiError({ status: 409, code: 'CONFLICT', message: 'The kitchen already started this order.' }),
    )
    const { wrapper } = await load()

    await button(wrapper, 'Cancel order').trigger('click')
    await button(wrapper, 'Yes, cancel it').trigger('click')
    await flushPromises()

    expect(useToastStore().items.map((toast) => toast.message)).toEqual(['The kitchen already started this order.'])
    expect(wrapper.find('.order__cancelled').exists()).toBe(false)
  })

  it('explains an order that does not exist, or belongs to someone else', async () => {
    vi.spyOn(orderService, 'get').mockRejectedValue(new ApiError({ status: 404, code: 'NOT_FOUND' }))
    vi.spyOn(paymentService, 'forOrder').mockResolvedValue([])
    const { wrapper } = await mountAt(OrderView, '/orders/999', { user: USERS.client })

    expect(wrapper.text()).toContain('Order not found')
  })

  it('reports a technical failure and can retry', async () => {
    vi.spyOn(orderService, 'get')
      .mockRejectedValueOnce(new ApiError({ status: 500, code: 'SERVER_ERROR' }))
      .mockResolvedValueOnce(makeOrder())
    vi.spyOn(paymentService, 'forOrder').mockResolvedValue([])
    const { wrapper } = await mountAt(OrderView, '/orders/42', { user: USERS.client })

    expect(wrapper.text()).toContain('The order could not be loaded.')
    await button(wrapper, 'Try again').trigger('click')
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Order #42')
  })

  it('refreshes itself while the order is in progress', async () => {
    const { wrapper } = await load()
    orderService.get.mockResolvedValue(makeOrder({ status: 'confirmed' }))

    wrapper.vm.tick()
    await flushPromises()

    expect(wrapper.get('[aria-current="step"]').text()).toContain('Confirmed')
  })

  it('stops refreshing once the order is finished and nothing is pending', async () => {
    const { wrapper } = await load({ order: makeOrder({ status: 'completed' }), payments: [makePayment()] })
    orderService.get.mockClear()

    wrapper.vm.tick()

    expect(orderService.get).not.toHaveBeenCalled()
  })

  it('does not refresh while the tab is hidden', async () => {
    const { wrapper } = await load()
    orderService.get.mockClear()
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)

    wrapper.vm.tick()

    expect(orderService.get).not.toHaveBeenCalled()
  })

  it('keeps what is shown when a refresh fails', async () => {
    const { wrapper } = await load()
    orderService.get.mockRejectedValue(new ApiError({ status: 0, code: 'NETWORK_ERROR' }))

    wrapper.vm.tick()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Order #42')
  })

  it('stops its timer when the page is left', async () => {
    const clear = vi.spyOn(globalThis, 'clearInterval')
    const { wrapper } = await load()

    wrapper.unmount()

    expect(clear).toHaveBeenCalled()
  })
})

describe('OrdersView', () => {
  const list = (results, count = results.length) => vi.spyOn(orderService, 'list').mockResolvedValue(page(results, count))

  it('lists the orders with their status, type, size and total', async () => {
    list([makeOrder(), makeOrder({ id: 41, status: 'completed', order_type: 'takeaway', total: '9.90' })])
    const { wrapper } = await mountAt(OrdersView, '/orders', { user: USERS.client })

    const rows = wrapper.findAll('a.row')
    expect(rows).toHaveLength(2)
    expect(rows[0].attributes('href')).toBe('/orders/42')
    expect(rows[0].text()).toContain('Order #42')
    expect(rows[0].text()).toContain('3 items')
    expect(rows[0].text()).toContain('Pending')
    expect(rows[0].text()).toContain('$34.10')
    expect(rows[1].text()).toContain('Takeaway')
    expect(rows[1].text()).toContain('Completed')
  })

  it('explains that there are no orders yet', async () => {
    list([])
    const { wrapper } = await mountAt(OrdersView, '/orders', { user: USERS.client })

    expect(wrapper.text()).toContain('No orders yet')
    expect(wrapper.get('a[href="/menu"]').exists()).toBe(true)
  })

  it('reports a failure and can retry', async () => {
    vi.spyOn(orderService, 'list')
      .mockRejectedValueOnce(new ApiError({ status: 0, code: 'NETWORK_ERROR' }))
      .mockResolvedValueOnce(page([makeOrder()]))
    const { wrapper } = await mountAt(OrdersView, '/orders', { user: USERS.client })

    expect(wrapper.text()).toContain('Your orders could not be loaded.')
    await button(wrapper, 'Try again').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('a.row')).toHaveLength(1)
  })

  it('pages through the orders', async () => {
    const spy = list([makeOrder()], 25)
    const { wrapper, router } = await mountAt(OrdersView, '/orders', { user: USERS.client })

    expect(wrapper.text()).toContain('Page 1 of 3')
    await wrapper.findAll('nav button')[1].trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ page: '2' })
    expect(spy).toHaveBeenLastCalledWith({ page: 2, page_size: 10 })
  })
})

describe('payment safety', () => {
  it('never starts a second payment while one is being made', async () => {
    let finish
    const pay = vi.spyOn(paymentService, 'pay').mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const { wrapper } = await mountAt(PaymentPanel, '/orders/42', {
      user: USERS.client,
      props: { order: makeOrder(), payments: [] },
    })

    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')
    finish(makePayment())
    await flushPromises()

    expect(pay).toHaveBeenCalledTimes(1)
  })
})
