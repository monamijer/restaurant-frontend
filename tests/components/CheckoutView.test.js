import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { orderService } from '@/services/orderService'
import { tableService } from '@/services/tableService'
import { useCartStore } from '@/store/cart'
import { useRestaurantStore } from '@/store/restaurant'
import { useTableStore } from '@/store/table'
import { useToastStore } from '@/store/toasts'
import { ApiError } from '@/utils/errors'
import CheckoutView from '@/views/CheckoutView.vue'
import { makeOrder } from '../helpers/fixtures'
import { mountAt, USERS } from '../helpers/app'

const FISH = { id: 7, name: 'Grilled fish', price: '12.50', image: null, is_available: true }
const FRIES = { id: 8, name: 'Fries', price: '6.00', image: null, is_available: true }

async function checkout({ lines = [[FISH, 2], [FRIES, 1]], seated = false, notes = {} } = {}) {
  const page = await mountAt(CheckoutView, '/checkout', {
    user: USERS.client,
    before() {
      const cart = useCartStore()
      for (const [item, quantity] of lines) cart.add(item, quantity)
      for (const [id, note] of Object.entries(notes)) cart.setNote(Number(id), note)
      useRestaurantStore().settings = { name: 'Chez Test', tax_rate: '10.00' }
      if (seated) useTableStore().table = { token: 'tok:1', id: 3, number: 5 }
    },
  })
  return page
}

const pick = (wrapper, type) => wrapper.get(`input[name="order-type"][value="${type}"]`).setValue()
const submit = async (wrapper) => {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}
const sent = (create) => create.mock.calls[0][0]

describe('CheckoutView basics', () => {
  it('has nothing to do with an empty cart', async () => {
    const { wrapper } = await checkout({ lines: [] })

    expect(wrapper.text()).toContain('There is nothing to order')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.get('a[href="/menu"]').exists()).toBe(true)
  })

  it('summarises the order with the same estimate as the cart', async () => {
    const { wrapper } = await checkout()

    const lines = wrapper.findAll('.summary__line').map((line) => line.findAll('span').map((span) => span.text()))
    expect(lines).toEqual([
      ['2 × Grilled fish', '$25.00'],
      ['1 × Fries', '$6.00'],
    ])
    const rows = wrapper.findAll('.summary__rows div').map((row) => [row.get('dt').text(), row.get('dd').text()])
    expect(rows).toEqual([
      ['Subtotal', '$31.00'],
      ['Tax (10%)', '$3.10'],
      ['Estimated total', '$34.10'],
    ])
  })

  it('offers the three ways to receive an order, takeaway first when not seated', async () => {
    const { wrapper } = await checkout()

    const labels = wrapper.findAll('.type strong').map((label) => label.text())
    expect(labels).toEqual(['Eat here', 'Takeaway', 'Delivery'])
    expect(wrapper.get('input[value="takeaway"]').element.checked).toBe(true)
  })

  it('starts on "Eat here" for a diner who scanned a table', async () => {
    const { wrapper } = await checkout({ seated: true })

    expect(wrapper.get('input[value="dine_in"]').element.checked).toBe(true)
    expect(wrapper.text()).toContain('You are at table 5.')
  })
})

describe('what each order type asks for', () => {
  it('takeaway asks for an optional phone only', async () => {
    const { wrapper } = await checkout()

    expect(wrapper.find('input[name="delivery_address"]').exists()).toBe(false)
    expect(wrapper.get('input[name="contact_phone"]').attributes('required')).toBeUndefined()
  })

  it('delivery asks for an address and a phone, both required', async () => {
    const { wrapper } = await checkout()

    await pick(wrapper, 'delivery')

    expect(wrapper.get('input[name="delivery_address"]').attributes('required')).toBeDefined()
    expect(wrapper.get('input[name="contact_phone"]').attributes('required')).toBeDefined()
  })

  it('dine-in without a table explains how to get one and has no phone', async () => {
    const { wrapper } = await checkout()

    await pick(wrapper, 'dine_in')

    expect(wrapper.text()).toContain('Scan the QR code on your table')
    expect(wrapper.find('input[name="table_code"]').exists()).toBe(true)
    expect(wrapper.find('input[name="contact_phone"]').exists()).toBe(false)
  })
})

describe('choosing a table', () => {
  it('accepts a pasted scan link', async () => {
    const resolve = vi.spyOn(tableService, 'resolveQr').mockResolvedValue({ id: 3, number: 5, capacity: 4, location: '' })
    const { wrapper } = await checkout()
    await pick(wrapper, 'dine_in')

    await wrapper.get('input[name="table_code"]').setValue('https://site.example/scan?t=abc:def:ghi')
    await wrapper.findAll('button').find((button) => button.text() === 'Use this code').trigger('click')
    await flushPromises()

    expect(resolve).toHaveBeenCalledWith('abc:def:ghi')
    expect(wrapper.text()).toContain('You are at table 5.')
    expect(wrapper.find('input[name="table_code"]').exists()).toBe(false)
  })

  it('says a code is invalid without calling the server when it cannot be one', async () => {
    const resolve = vi.spyOn(tableService, 'resolveQr')
    const { wrapper } = await checkout()
    await pick(wrapper, 'dine_in')

    await wrapper.get('input[name="table_code"]').setValue('not a code!')
    await wrapper.findAll('button').find((button) => button.text() === 'Use this code').trigger('click')

    expect(resolve).not.toHaveBeenCalled()
    expect(wrapper.get('.field__error').text()).toContain('This table code is not valid')
  })

  it('says so when the server refuses the code', async () => {
    vi.spyOn(tableService, 'resolveQr').mockRejectedValue(new ApiError({ status: 400, code: 'VALIDATION_ERROR' }))
    const { wrapper } = await checkout()
    await pick(wrapper, 'dine_in')

    await wrapper.get('input[name="table_code"]').setValue('abc:def')
    await wrapper.findAll('button').find((button) => button.text() === 'Use this code').trigger('click')
    await flushPromises()

    expect(wrapper.get('.field__error').text()).toContain('This table code is not valid')
    expect(useTableStore().isSeated).toBe(false)
  })

  it('lets the diner leave the table', async () => {
    const { wrapper } = await checkout({ seated: true })

    await wrapper.findAll('button').find((button) => button.text() === 'Not your table?').trigger('click')

    expect(useTableStore().isSeated).toBe(false)
    expect(wrapper.find('input[name="table_code"]').exists()).toBe(true)
  })
})

describe('placing the order', () => {
  it('sends a takeaway order with the cart lines and no prices, then clears the cart', async () => {
    const create = vi.spyOn(orderService, 'create').mockResolvedValue(makeOrder({ id: 42, order_type: 'takeaway' }))
    const { wrapper, router } = await checkout({ notes: { 7: '  well done ' } })

    await wrapper.get('input[name="contact_phone"]').setValue(' +25779000001 ')
    await wrapper.get('input[name="notes"]').setValue(' at 7pm ')
    await submit(wrapper)

    expect(sent(create)).toEqual({
      order_type: 'takeaway',
      items: [
        { menu_item: 7, quantity: 2, special_instructions: 'well done' },
        { menu_item: 8, quantity: 1, special_instructions: '' },
      ],
      notes: 'at 7pm',
      contact_phone: '+25779000001',
    })
    expect(useCartStore().isEmpty).toBe(true)
    expect(useToastStore().items.map((toast) => toast.message)).toEqual(['Order #42 placed.'])
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/orders/42'))
  })

  it('proves presence for a dine-in order with the table token, never a table number', async () => {
    const create = vi.spyOn(orderService, 'create').mockResolvedValue(makeOrder())
    const { wrapper } = await checkout({ seated: true })

    await submit(wrapper)

    const body = sent(create)
    expect(body.order_type).toBe('dine_in')
    expect(body.table_token).toBe('tok:1')
    expect(body).not.toHaveProperty('table')
    expect(body).not.toHaveProperty('contact_phone')
  })

  it('sends the address and phone for a delivery', async () => {
    const create = vi.spyOn(orderService, 'create').mockResolvedValue(makeOrder({ order_type: 'delivery' }))
    const { wrapper } = await checkout()
    await pick(wrapper, 'delivery')

    await wrapper.get('input[name="delivery_address"]').setValue(' 12 Rue du Lac ')
    await wrapper.get('input[name="contact_phone"]').setValue('+25779000001')
    await submit(wrapper)

    expect(sent(create)).toMatchObject({
      order_type: 'delivery',
      delivery_address: '12 Rue du Lac',
      contact_phone: '+25779000001',
    })
  })

  it('checks the essentials before calling the server', async () => {
    const create = vi.spyOn(orderService, 'create')
    const { wrapper } = await checkout()
    await pick(wrapper, 'delivery')

    await submit(wrapper)

    expect(create).not.toHaveBeenCalled()
    expect(wrapper.findAll('.field__error').map((error) => error.text())).toEqual([
      'This field is required.',
      'This field is required.',
    ])
  })

  it('refuses a dine-in order without a table', async () => {
    const create = vi.spyOn(orderService, 'create')
    const { wrapper } = await checkout()
    await pick(wrapper, 'dine_in')

    await submit(wrapper)

    expect(create).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Scan the QR code on your table')
  })

  it('is busy while the order is sent, and cannot be sent twice', async () => {
    let finish
    const create = vi.spyOn(orderService, 'create').mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const { wrapper } = await checkout()

    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('button[type="submit"]').attributes('aria-busy')).toBe('true')
    await wrapper.get('form').trigger('submit')
    finish(makeOrder())
    await flushPromises()

    expect(create).toHaveBeenCalledTimes(1)
  })
})

describe('when the server refuses the order', () => {
  it('puts each message next to its field', async () => {
    vi.spyOn(orderService, 'create').mockRejectedValue(
      new ApiError({
        status: 400,
        code: 'VALIDATION_ERROR',
        errors: { contact_phone: ['Enter a valid phone number.'], notes: ['Too long.'] },
      }),
    )
    const { wrapper } = await checkout()

    await wrapper.get('input[name="contact_phone"]').setValue('abc')
    await submit(wrapper)

    expect(wrapper.findAll('.field__error').map((error) => error.text())).toEqual([
      'Enter a valid phone number.',
      'Too long.',
    ])
    expect(useCartStore().isEmpty).toBe(false)
  })

  it('points out the dishes that can no longer be ordered, and removes them on request', async () => {
    vi.spyOn(orderService, 'create').mockRejectedValue(
      new ApiError({
        status: 400,
        code: 'VALIDATION_ERROR',
        errors: { items: [{}, { menu_item: ["'Fries' is not available."] }] },
      }),
    )
    const { wrapper } = await checkout()

    await submit(wrapper)

    expect(wrapper.get('.problems').text()).toContain('Some dishes can no longer be ordered')
    expect(wrapper.get('.summary__problem').text()).toBe("'Fries' is not available.")

    await wrapper.findAll('button').find((button) => button.text() === 'Remove these dishes').trigger('click')

    expect(useCartStore().lines.map((line) => line.id)).toEqual([7])
    expect(wrapper.find('.problems').exists()).toBe(false)
  })

  it('forgets a table code the server no longer accepts, so the diner scans again', async () => {
    vi.spyOn(orderService, 'create').mockRejectedValue(
      new ApiError({ status: 400, code: 'VALIDATION_ERROR', errors: { table_token: ['Invalid code.'] } }),
    )
    const { wrapper } = await checkout({ seated: true })

    await submit(wrapper)

    expect(useTableStore().isSeated).toBe(false)
    expect(wrapper.text()).toContain('This table code is not valid')
  })

  it('keeps the cart and says what happened when the server is unreachable', async () => {
    vi.spyOn(orderService, 'create').mockRejectedValue(new ApiError({ status: 0, code: 'NETWORK_ERROR' }))
    const { wrapper } = await checkout()

    await submit(wrapper)

    expect(wrapper.get('[role="alert"]').text()).toBe('Cannot connect. Check your network, then try again.')
    expect(useCartStore().isEmpty).toBe(false)
  })
})
