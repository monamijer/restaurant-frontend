import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_CART_LINES, MAX_LINE_QUANTITY, MAX_NOTE_LENGTH } from '@/config'
import { CART_KEY, useCartStore } from '@/store/cart'
import { useRestaurantStore } from '@/store/restaurant'

const fish = { id: 7, name: 'Grilled fish', price: '12.50', image: 'http://localhost:8000/media/fish.jpg', is_available: true }
const fries = { id: 8, name: 'Fries', price: '6.00', image: null, is_available: true }

const stored = () => JSON.parse(window.localStorage.getItem(CART_KEY))

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('adding dishes', () => {
  it('starts empty', () => {
    const cart = useCartStore()

    expect(cart.isEmpty).toBe(true)
    expect(cart.count).toBe(0)
    expect(cart.subtotal).toBe('0.00')
  })

  it('adds a dish with a snapshot of what is shown', () => {
    const cart = useCartStore()

    expect(cart.add(fish)).toBe('added')

    expect(cart.lines).toEqual([
      { id: 7, name: 'Grilled fish', price: '12.50', image: fish.image, quantity: 1, note: '' },
    ])
  })

  it('adding the same dish again raises its quantity instead of adding a line', () => {
    const cart = useCartStore()

    cart.add(fish)
    cart.add(fish, 2)

    expect(cart.lines).toHaveLength(1)
    expect(cart.quantityOf(7)).toBe(3)
  })

  it('refuses a dish that is not available', () => {
    const cart = useCartStore()

    expect(cart.add({ ...fish, is_available: false })).toBe('unavailable')

    expect(cart.isEmpty).toBe(true)
  })

  it('refuses more than the backend accepts of one dish', () => {
    const cart = useCartStore()
    cart.add(fish, MAX_LINE_QUANTITY)

    expect(cart.add(fish)).toBe('limit')

    expect(cart.quantityOf(7)).toBe(MAX_LINE_QUANTITY)
  })

  it('refuses a new dish when the cart already has the maximum number of lines', () => {
    const cart = useCartStore()
    for (let id = 1; id <= MAX_CART_LINES; id += 1) cart.add({ ...fish, id })

    expect(cart.add({ ...fish, id: 999 })).toBe('limit')

    expect(cart.lines).toHaveLength(MAX_CART_LINES)
  })
})

describe('changing the cart', () => {
  it('sets a quantity, capped at the maximum', () => {
    const cart = useCartStore()
    cart.add(fish)

    cart.setQuantity(7, 4)
    expect(cart.quantityOf(7)).toBe(4)

    cart.setQuantity(7, 5000)
    expect(cart.quantityOf(7)).toBe(MAX_LINE_QUANTITY)
  })

  it('removes a dish when its quantity drops below one', () => {
    const cart = useCartStore()
    cart.add(fish)

    cart.setQuantity(7, 0)

    expect(cart.isEmpty).toBe(true)
  })

  it('ignores a quantity that is not a whole number', () => {
    const cart = useCartStore()
    cart.add(fish, 2)

    cart.setQuantity(7, 2.5)

    expect(cart.isEmpty).toBe(true) // Not a valid quantity: treated like removal, never stored.
  })

  it('keeps a note per dish, shortened to the allowed length', () => {
    const cart = useCartStore()
    cart.add(fish)

    cart.setNote(7, 'x'.repeat(MAX_NOTE_LENGTH + 50))

    expect(cart.lines[0].note).toHaveLength(MAX_NOTE_LENGTH)
  })

  it('removes one dish or everything', () => {
    const cart = useCartStore()
    cart.add(fish)
    cart.add(fries)

    cart.remove(7)
    expect(cart.lines.map((line) => line.id)).toEqual([8])

    cart.clear()
    expect(cart.isEmpty).toBe(true)
  })

  it('ignores changes to a dish that is not in the cart', () => {
    const cart = useCartStore()

    cart.setQuantity(99, 3)
    cart.setNote(99, 'x')
    cart.remove(99)

    expect(cart.isEmpty).toBe(true)
  })
})

describe('totals', () => {
  it('counts every unit and sums exactly', () => {
    const cart = useCartStore()
    cart.add(fish, 2)
    cart.add(fries)

    expect(cart.count).toBe(3)
    expect(cart.subtotal).toBe('31.00')
    expect(cart.lineTotal(cart.lines[0])).toBe('25.00')
  })

  it('does not drift with awkward prices', () => {
    const cart = useCartStore()
    cart.add({ ...fish, id: 1, price: '0.10' })
    cart.add({ ...fish, id: 2, price: '0.20' })

    expect(cart.subtotal).toBe('0.30')
  })

  it('exposes the lines as the order endpoint expects them, with trimmed notes and no prices', () => {
    const cart = useCartStore()
    cart.add(fish, 2)
    cart.setNote(7, '  no salt  ')

    expect(cart.orderItems).toEqual([{ menu_item: 7, quantity: 2, special_instructions: 'no salt' }])
  })
})

describe('persistence', () => {
  it('saves every change and survives a reload', () => {
    const cart = useCartStore()
    cart.add(fish, 2)
    cart.setNote(7, 'well done')
    expect(stored().lines[0]).toMatchObject({ id: 7, quantity: 2, note: 'well done' })

    setActivePinia(createPinia())
    const reloaded = useCartStore()

    expect(reloaded.lines).toHaveLength(1)
    expect(reloaded.lines[0]).toMatchObject({ id: 7, quantity: 2, note: 'well done' })
  })

  it('removes the stored copy when the cart becomes empty', () => {
    const cart = useCartStore()
    cart.add(fish)

    cart.clear()

    expect(window.localStorage.getItem(CART_KEY)).toBeNull()
  })

  it.each([
    ['text that is not JSON', 'not json'],
    ['something other than a cart', JSON.stringify({ hello: 'world' })],
    ['lines that are not a list', JSON.stringify({ v: 1, lines: 'oops' })],
  ])('starts empty after %s in storage', (_label, raw) => {
    window.localStorage.setItem(CART_KEY, raw)

    expect(useCartStore().isEmpty).toBe(true)
  })

  it('drops stored lines that were tampered with, and keeps the good ones', () => {
    const good = { id: 7, name: 'Grilled fish', price: '12.50', image: null, quantity: 2, note: '' }
    const bad = [
      { ...good, id: 'abc' },
      { ...good, id: 2, price: '-5' },
      { ...good, id: 3, price: '1e9' },
      { ...good, id: 4, quantity: 0 },
      { ...good, id: 5, quantity: 5000 },
      { ...good, id: 6, name: '' },
      null,
      'text',
    ]
    window.localStorage.setItem(CART_KEY, JSON.stringify({ v: 1, lines: [good, ...bad] }))

    expect(useCartStore().lines).toEqual([good])
  })

  it('removes duplicate lines and unsafe picture addresses from storage', () => {
    const line = { id: 7, name: 'Fish', price: '5.00', image: 'javascript:alert(1)', quantity: 1, note: '' }
    window.localStorage.setItem(CART_KEY, JSON.stringify({ v: 1, lines: [line, { ...line, quantity: 3 }] }))

    const cart = useCartStore()

    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0].image).toBeNull()
  })

  it('follows a change made in another tab', () => {
    const cart = useCartStore()
    cart.add(fish)
    const other = { v: 1, lines: [{ id: 8, name: 'Fries', price: '6.00', image: null, quantity: 3, note: '' }] }

    window.localStorage.setItem(CART_KEY, JSON.stringify(other))
    cart.reload()

    expect(cart.lines.map((line) => line.id)).toEqual([8])
  })
})

describe('restaurant tax rate', () => {
  it('is unknown until the settings load', () => {
    const restaurant = useRestaurantStore()
    expect(restaurant.taxRate).toBeNull()

    restaurant.settings = { name: 'Chez Test', tax_rate: '10.00' }

    expect(restaurant.taxRate).toBe('10.00')
  })
})
