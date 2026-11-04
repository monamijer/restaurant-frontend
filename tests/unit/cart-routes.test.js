import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { applyLocale } from '@/i18n'
import { createAppRouter } from '@/router'
import { useAuthStore } from '@/store/auth'
import { USERS } from '../helpers/app'

async function visit(path, user = null) {
  setActivePinia(createPinia())
  applyLocale('en')
  const auth = useAuthStore()
  auth.user = user
  auth.restored = true
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  return router.currentRoute.value
}

describe('cart routes', () => {
  it('lets anyone fill a cart', async () => {
    expect((await visit('/cart')).name).toBe('cart')
  })

  it('asks a visitor to sign in before checkout and brings them back', async () => {
    const route = await visit('/checkout')

    expect(route.name).toBe('login')
    expect(route.query.redirect).toBe('/checkout')
  })

  it.each(['client', 'staff', 'admin'])('opens the checkout to a signed-in %s', async (role) => {
    expect((await visit('/checkout', USERS[role])).name).toBe('checkout')
  })

  it('names the pages in the browser tab', async () => {
    await visit('/cart')

    expect(document.title).toBe('Cart · Restaurant')
  })
})

describe('ordering routes', () => {
  it('lets anyone scan a table code', async () => {
    expect((await visit('/scan?t=abc')).name).toBe('scan')
  })

  it.each(['/orders', '/orders/42'])('keeps %s for signed-in users and brings visitors back after sign in', async (path) => {
    const route = await visit(path)

    expect(route.name).toBe('login')
    expect(route.query.redirect).toBe(path)
  })

  it('opens a customer order page to signed-in users', async () => {
    const route = await visit('/orders/42', USERS.client)

    expect(route.name).toBe('order')
    expect(route.params.id).toBe('42')
  })

  it('treats an order address that is not a number as a missing page', async () => {
    expect((await visit('/orders/abc', USERS.client)).name).toBe('not-found')
  })
})

describe('booking, queue, invoice and notification routes', () => {
  it('lets anyone look at the queue', async () => {
    expect((await visit('/queue')).name).toBe('queue')
  })

  it.each(['/reservations', '/reservations/new', '/invoices', '/notifications'])(
    'keeps %s for signed-in users and brings visitors back after sign in',
    async (path) => {
      const route = await visit(path)

      expect(route.name).toBe('login')
      expect(route.query.redirect).toBe(path)
    },
  )

  it.each([
    ['/reservations', 'reservations'],
    ['/reservations/new', 'reservation-new'],
    ['/invoices', 'invoices'],
    ['/notifications', 'notifications'],
  ])('opens %s to a signed-in customer', async (path, name) => {
    expect((await visit(path, USERS.client)).name).toBe(name)
  })
})
