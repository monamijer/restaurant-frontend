import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AddToCartButton from '@/components/cart/AddToCartButton.vue'
import CartLink from '@/components/cart/CartLink.vue'
import QuantityStepper from '@/components/cart/QuantityStepper.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import MenuItemCard from '@/components/menu/MenuItemCard.vue'
import { MAX_CART_LINES, MAX_LINE_QUANTITY } from '@/config'
import { menuService } from '@/services/menuService'
import { useCartStore } from '@/store/cart'
import { useToastStore } from '@/store/toasts'
import MenuItemView from '@/views/MenuItemView.vue'
import { mountAt } from '../helpers/app'

const FISH = {
  id: 7,
  category: 1,
  category_name: 'Mains',
  name: 'Grilled fish',
  slug: 'grilled-fish',
  description: 'Fresh fish.',
  price: '12.50',
  image: null,
  is_available: true,
  preparation_time: 20,
  is_featured: false,
  allergens: [],
  calories: 540,
}

const button = (wrapper, text) => wrapper.findAll('button').find((candidate) => candidate.text() === text)
const labelled = (wrapper, label) => wrapper.find(`button[aria-label="${label}"]`)

describe('QuantityStepper', () => {
  it('shows the quantity and names what each button changes', async () => {
    const { wrapper } = await mountAt(QuantityStepper, '/', { props: { modelValue: 3, label: 'Grilled fish' } })

    expect(wrapper.get('.stepper__value').text()).toBe('3')
    expect(labelled(wrapper, 'Decrease the quantity of Grilled fish').exists()).toBe(true)
    expect(labelled(wrapper, 'Increase the quantity of Grilled fish').exists()).toBe(true)
  })

  it('asks for one more or one less', async () => {
    const { wrapper } = await mountAt(QuantityStepper, '/', { props: { modelValue: 3, label: 'Fish' } })

    await labelled(wrapper, 'Increase the quantity of Fish').trigger('click')
    await labelled(wrapper, 'Decrease the quantity of Fish').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[4], [2]])
  })

  it('stops at its limits', async () => {
    const low = await mountAt(QuantityStepper, '/', { props: { modelValue: 1, label: 'Fish' } })
    const high = await mountAt(QuantityStepper, '/', { props: { modelValue: MAX_LINE_QUANTITY, label: 'Fish' } })

    expect(labelled(low.wrapper, 'Decrease the quantity of Fish').attributes('disabled')).toBeDefined()
    expect(labelled(high.wrapper, 'Increase the quantity of Fish').attributes('disabled')).toBeDefined()
  })
})

describe('AddToCartButton', () => {
  it('adds the dish, turns into a stepper and tells the visitor', async () => {
    const { wrapper } = await mountAt(AddToCartButton, '/menu', { props: { item: FISH } })

    await button(wrapper, 'Add to cart').trigger('click')

    expect(useCartStore().quantityOf(7)).toBe(1)
    expect(wrapper.get('.stepper__value').text()).toBe('1')
    expect(useToastStore().items.map((toast) => toast.message)).toEqual(['Grilled fish added to your cart.'])
  })

  it('changes the quantity and goes back to a button when it reaches zero', async () => {
    const { wrapper } = await mountAt(AddToCartButton, '/menu', { props: { item: FISH } })
    await button(wrapper, 'Add to cart').trigger('click')

    await labelled(wrapper, 'Increase the quantity of Grilled fish').trigger('click')
    expect(useCartStore().quantityOf(7)).toBe(2)

    await labelled(wrapper, 'Decrease the quantity of Grilled fish').trigger('click')
    await labelled(wrapper, 'Decrease the quantity of Grilled fish').trigger('click')

    expect(useCartStore().isEmpty).toBe(true)
    expect(button(wrapper, 'Add to cart')).toBeDefined()
  })

  it('cannot add a dish that is unavailable', async () => {
    const { wrapper } = await mountAt(AddToCartButton, '/menu', { props: { item: { ...FISH, is_available: false } } })

    expect(button(wrapper, 'Add to cart').attributes('disabled')).toBeDefined()
  })

  it('explains when the cart is full', async () => {
    const { wrapper } = await mountAt(AddToCartButton, '/menu', { props: { item: FISH } })
    const cart = useCartStore()
    for (let id = 100; id < 100 + MAX_CART_LINES; id += 1) cart.add({ ...FISH, id })

    await button(wrapper, 'Add to cart').trigger('click')

    expect(cart.quantityOf(7)).toBe(0)
    expect(useToastStore().items.map((toast) => toast.message)).toEqual([
      'Your cart is full. Remove a dish before adding another.',
    ])
  })

  it('shows the cart content of a dish added earlier', async () => {
    const { wrapper } = await mountAt(AddToCartButton, '/menu', { props: { item: FISH } })

    useCartStore().add(FISH, 3)
    await wrapper.vm.$nextTick()

    expect(wrapper.get('.stepper__value').text()).toBe('3')
  })
})

describe('CartLink and header', () => {
  it('says the cart is empty and shows no count', async () => {
    const { wrapper } = await mountAt(CartLink, '/')

    expect(wrapper.attributes('aria-label')).toBe('Cart: 0 items')
    expect(wrapper.find('.cart-link__count').exists()).toBe(false)
    expect(wrapper.attributes('href')).toBe('/cart')
  })

  it('shows how many items it holds, in the singular and the plural', async () => {
    const { wrapper } = await mountAt(CartLink, '/')
    const cart = useCartStore()

    cart.add(FISH)
    await wrapper.vm.$nextTick()
    expect(wrapper.attributes('aria-label')).toBe('Cart: 1 item')

    cart.add(FISH, 2)
    await wrapper.vm.$nextTick()
    expect(wrapper.attributes('aria-label')).toBe('Cart: 3 items')
    expect(wrapper.get('.cart-link__count').text()).toBe('3')
  })

  it('is part of the header', async () => {
    const { wrapper } = await mountAt(AppHeader, '/')

    expect(wrapper.find('a[href="/cart"]').exists()).toBe(true)
  })
})

describe('adding from the menu pages', () => {
  it('works from a dish card without opening the dish', async () => {
    const { wrapper, router } = await mountAt(MenuItemCard, '/menu', { props: { item: FISH } })

    await button(wrapper, 'Add to cart').trigger('click')

    expect(useCartStore().quantityOf(7)).toBe(1)
    expect(router.currentRoute.value.path).toBe('/menu')
  })

  it('works from the dish page', async () => {
    vi.spyOn(menuService, 'item').mockResolvedValue(FISH)
    const { wrapper } = await mountAt(MenuItemView, '/menu/7')
    await flushPromises()

    await button(wrapper, 'Add to cart').trigger('click')

    expect(useCartStore().quantityOf(7)).toBe(1)
  })
})
