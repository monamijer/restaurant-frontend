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
