import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { orderService } from '@/services/orderService'
import { paymentService } from '@/services/paymentService'
import { tableService } from '@/services/tableService'
import { session } from '@/services/session'
import { TABLE_KEY, useTableStore } from '@/store/table'
import { ApiError } from '@/utils/errors'
import { isFinished, ORDER_STEPS, orderStatusTone } from '@/utils/orders'
import { extractTableToken } from '@/utils/tableCode'
import { envelope, fakeServer, reply } from '../helpers/http'
import { makeOrder, makePayment, page } from '../helpers/fixtures'

beforeEach(() => {
  session.clear()
  setActivePinia(createPinia())
})

describe('orderService', () => {
  it('creates an order with the access token', async () => {
    session.setTokens({ access: 'a1' })
    const requests = fakeServer((config) => reply(config, 201, makeOrder()))

    const order = await orderService.create({ order_type: 'takeaway', items: [] })

    expect(order.id).toBe(42)
    expect(requests[0]).toMatchObject({ method: 'post', url: '/orders/', auth: 'Bearer a1' })
    expect(JSON.parse(requests[0].body)).toEqual({ order_type: 'takeaway', items: [] })
  })

  it('reads, lists and cancels', async () => {
    const seen = []
    fakeServer((config) => {
      seen.push([config.method, config.url, config.params])
      return reply(config, 200, config.url === '/orders/' ? page([makeOrder()]) : makeOrder())
    })

    await orderService.get(42)
    await orderService.list({ page: 2, page_size: 10 })
    await orderService.cancel(42)

    expect(seen).toEqual([
      ['get', '/orders/42/', undefined],
      ['get', '/orders/', { page: 2, page_size: 10 }],
      ['post', '/orders/42/cancel/', undefined],
    ])
  })
})

describe('paymentService', () => {
  it('lists the payments of one order, newest first', async () => {
    let params
    fakeServer((config) => {
      params = config.params
      return reply(config, 200, page([makePayment()]))
    })

    const payments = await paymentService.forOrder(42)

    expect(payments).toHaveLength(1)
    expect(params).toEqual({ order: 42, ordering: '-created_at' })
  })

  it('pays without ever sending an amount, and only sends a token when there is one', async () => {
    const requests = fakeServer((config) => reply(config, 201, makePayment()))

    await paymentService.pay({ order: 42, method: 'cash', token: '' })
    await paymentService.pay({ order: 42, method: 'card', token: 'tok_demo_card' })

    expect(JSON.parse(requests[0].body)).toEqual({ order: 42, method: 'cash' })
    expect(JSON.parse(requests[1].body)).toEqual({ order: 42, method: 'card', payment_token: 'tok_demo_card' })
  })

  it('cancels a payment', async () => {
    const requests = fakeServer((config) => reply(config, 200, makePayment({ status: 'failed' })))

    await paymentService.cancel(9)

    expect(requests[0]).toMatchObject({ method: 'post', url: '/payments/9/cancel/' })
  })
})

describe('tableService', () => {
  it('resolves a scanned token without credentials', async () => {
    session.setTokens({ access: 'a1' })
    const requests = fakeServer((config) => reply(config, 200, { id: 3, number: 5, capacity: 4, location: 'Terrace' }))

    const table = await tableService.resolveQr('abc:def')

    expect(table.number).toBe(5)
    expect(requests[0]).toMatchObject({ url: '/tables/resolve-qr/', auth: undefined })
    expect(JSON.parse(requests[0].body)).toEqual({ token: 'abc:def' })
  })
})

describe('extractTableToken', () => {
  it('takes the code from a scan link', () => {
    expect(extractTableToken('https://site.example/scan?t=eyJ0Ijo1fQ:1abc:Xy-z_9')).toBe('eyJ0Ijo1fQ:1abc:Xy-z_9')
  })

  it('accepts the bare code, ignoring spaces around it', () => {
    expect(extractTableToken('  eyJ0Ijo1fQ:1abc:Xy-z_9  ')).toBe('eyJ0Ijo1fQ:1abc:Xy-z_9')
  })

  it.each([
    ['', 'nothing'],
    ['   ', 'spaces'],
    ['https://site.example/scan', 'a link without a code'],
    ['two words', 'text with spaces'],
    ['<script>alert(1)</script>', 'markup'],
    ['x'.repeat(301), 'an overlong value'],
    [null, 'null'],
  ])('rejects %j (%s)', (input) => {
    expect(extractTableToken(input)).toBe('')
  })
})

describe('order helpers', () => {
  it('knows the steps, which statuses are final and the badge tone', () => {
    expect(ORDER_STEPS).toEqual(['pending', 'confirmed', 'preparing', 'ready', 'completed'])
    expect(isFinished('completed')).toBe(true)
    expect(isFinished('cancelled')).toBe(true)
    expect(isFinished('preparing')).toBe(false)
    expect(orderStatusTone('ready')).toBe('success')
    expect(orderStatusTone('cancelled')).toBe('danger')
    expect(orderStatusTone('mystery')).toBe('neutral')
  })
})

describe('table store', () => {
  it('remembers the table a scanned code designates, for this tab only', async () => {
    vi.spyOn(tableService, 'resolveQr').mockResolvedValue({ id: 3, number: 5, capacity: 4, location: 'x' })
    const table = useTableStore()

    await table.scan('tok:1')

    expect(table.isSeated).toBe(true)
    expect(table.number).toBe(5)
    expect(table.token).toBe('tok:1')
    expect(JSON.parse(window.sessionStorage.getItem(TABLE_KEY))).toEqual({ token: 'tok:1', id: 3, number: 5 })
    expect(window.localStorage.getItem(TABLE_KEY)).toBeNull()
  })

  it('stays unseated when the backend refuses the code', async () => {
    vi.spyOn(tableService, 'resolveQr').mockRejectedValue(new ApiError({ status: 400, code: 'VALIDATION_ERROR' }))
    const table = useTableStore()

    await expect(table.scan('bad')).rejects.toBeInstanceOf(ApiError)

    expect(table.isSeated).toBe(false)
    expect(window.sessionStorage.getItem(TABLE_KEY)).toBeNull()
  })

  it('is restored from the tab storage, and leaving forgets it', () => {
    window.sessionStorage.setItem(TABLE_KEY, JSON.stringify({ token: 'tok:1', id: 3, number: 5 }))
    const table = useTableStore()

    expect(table.number).toBe(5)

    table.clear()
    expect(table.isSeated).toBe(false)
    expect(window.sessionStorage.getItem(TABLE_KEY)).toBeNull()
  })

  it.each([
    ['not json', 'oops'],
    ['an empty token', JSON.stringify({ token: '', id: 1, number: 1 })],
    ['a text number', JSON.stringify({ token: 't', id: 1, number: 'five' })],
  ])('ignores damaged storage (%s)', (_label, raw) => {
    window.sessionStorage.setItem(TABLE_KEY, raw)

    expect(useTableStore().isSeated).toBe(false)
  })
})

describe('error shape used by checkout', () => {
  it('keeps the per-line answers of a refused order', async () => {
    fakeServer((config) =>
      reply(config, 400, envelope('VALIDATION_ERROR', 'Validation failed.', { items: [{}, { menu_item: ['Fries is not available.'] }] })),
    )

    const error = await orderService.create({}).catch((e) => e)

    expect(error.errors.items[1].menu_item[0]).toBe('Fries is not available.')
  })
})
