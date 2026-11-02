import { describe, expect, it } from 'vitest'
import { useCartStore } from '@/store/cart'
import { useRestaurantStore } from '@/store/restaurant'
import { useToastStore } from '@/store/toasts'
import { useUiStore } from '@/store/ui'
import CartView from '@/views/CartView.vue'
import { mountAt } from '../helpers/app'

const FISH = { id: 7, name: 'Grilled fish', price: '12.50', image: 'http://localhost:8000/media/fish.jpg', is_available: true }
const FRIES = { id: 8, name: 'Fries', price: '6.00', image: null, is_available: true }

async function cartPage({ lines = [[FISH, 2], [FRIES, 1]], taxRate = '10.00' } = {}) {
  const page = await mountAt(CartView, '/cart')
  const cart = useCartStore()
  for (const [item, quantity] of lines) cart.add(item, quantity)
  if (taxRate) useRestaurantStore().settings = { name: 'Chez Test', tax_rate: taxRate }
  await page.wrapper.vm.$nextTick()
  return { ...page, cart }
}

const labelled = (wrapper, label) => wrapper.find(`button[aria-label="${label}"]`)
const button = (wrapper, text) => wrapper.findAll('button').find((candidate) => candidate.text() === text)
const rows = (wrapper) => wrapper.findAll('.summary__rows div').map((row) => [row.get('dt').text(), row.get('dd').text()])

describe('CartView', () => {
  it('explains an empty cart and leads to the menu', async () => {
    const { wrapper } = await cartPage({ lines: [] })

    expect(wrapper.text()).toContain('Your cart is empty')
    expect(wrapper.get('a[href="/menu"]').text()).toBe('Browse the menu')
    expect(wrapper.find('.summary').exists()).toBe(false)
  })

  it('lists every dish with its price, quantity and line total', async () => {
    const { wrapper } = await cartPage()

    const lines = wrapper.findAll('.line')
    expect(lines).toHaveLength(2)
    expect(lines[0].text()).toContain('Grilled fish')
    expect(lines[0].text()).toContain('$12.50 each')
    expect(lines[0].get('.stepper__value').text()).toBe('2')
    expect(lines[0].get('.line__total').text()).toBe('$25.00')
    expect(lines[1].get('.line__total').text()).toBe('$6.00')
  })

  it('shows the subtotal, the estimated tax and the estimated total', async () => {
    const { wrapper } = await cartPage()

    expect(rows(wrapper)).toEqual([
      ['Subtotal', '$31.00'],
      ['Tax (10%)', '$3.10'],
      ['Estimated total', '$34.10'],
    ])
    expect(wrapper.get('.summary').text()).toContain('This is an estimate')
  })

  it('leaves the tax out when the rate is not known', async () => {
    const { wrapper } = await cartPage({ taxRate: null })

    expect(rows(wrapper)).toEqual([
      ['Subtotal', '$31.00'],
      ['Estimated total', '$31.00'],
    ])
  })

  it('changes a quantity and updates the totals', async () => {
    const { wrapper, cart } = await cartPage()

    await labelled(wrapper, 'Increase the quantity of Fries').trigger('click')

    expect(cart.quantityOf(8)).toBe(2)
    expect(rows(wrapper)[0]).toEqual(['Subtotal', '$37.00'])
  })

  it('keeps special instructions with the dish', async () => {
    const { wrapper, cart } = await cartPage()

    await wrapper.get('#note-7').setValue('Well done')

    expect(cart.lines[0].note).toBe('Well done')
  })

  it('removes a dish and says so', async () => {
    const { wrapper, cart } = await cartPage()

    await labelled(wrapper, 'Remove Fries from the cart').trigger('click')

    expect(cart.lines.map((line) => line.id)).toEqual([7])
    expect(useToastStore().items.map((toast) => toast.message)).toEqual(['Fries was removed from your cart.'])
  })

  it('asks before emptying the cart, and lets the visitor keep it', async () => {
    const { wrapper, cart } = await cartPage()

    await button(wrapper, 'Empty the cart').trigger('click')
    await button(wrapper, 'Keep my cart').trigger('click')

    expect(cart.lines).toHaveLength(2)
  })

  it('empties the cart after confirmation', async () => {
    const { wrapper, cart } = await cartPage()

    await button(wrapper, 'Empty the cart').trigger('click')
    await button(wrapper, 'Yes, empty it').trigger('click')

    expect(cart.isEmpty).toBe(true)
    expect(wrapper.text()).toContain('Your cart is empty')
  })

  it('leads to the checkout and back to the menu', async () => {
    const { wrapper } = await cartPage()

    const hrefs = wrapper.findAll('.summary a').map((link) => link.attributes('href'))

    expect(hrefs).toEqual(['/checkout', '/menu'])
  })

  it('formats amounts in the interface language', async () => {
    const { wrapper } = await cartPage()

    useUiStore().setLocale('fr')
    await wrapper.vm.$nextTick()

    expect(wrapper.get('.line__total').text().replace(/\s/g, ' ')).toMatch(/25,00/)
    useUiStore().setLocale('en')
  })
})
