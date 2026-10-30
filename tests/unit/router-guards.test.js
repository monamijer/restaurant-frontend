import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { applyLocale } from '@/i18n'
import { createAppRouter } from '@/router'
import { authService } from '@/services/authService'
import { session } from '@/services/session'
import { useAuthStore } from '@/store/auth'
import { USERS } from '../helpers/app'

async function visit(path, { user = null, restored = true } = {}) {
  setActivePinia(createPinia())
  applyLocale('en')
  const auth = useAuthStore()
  auth.user = user
  auth.restored = restored
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  return router.currentRoute.value
}

beforeEach(() => {
  session.clear()
})

describe('public pages', () => {
  it.each(['/', '/login', '/register', '/forgot-password', '/reset-password'])('%s is open to visitors', async (path) => {
    const route = await visit(path)

    expect(route.path).toBe(path)
  })

  it('shows a page for an unknown address', async () => {
    const route = await visit('/nothing/here')

    expect(route.name).toBe('not-found')
  })

  it('lets a signed-in visitor use a reset link', async () => {
    const route = await visit('/reset-password', { user: USERS.client })

    expect(route.name).toBe('reset-password')
  })
})

describe('protected pages', () => {
  it('send a visitor to sign in and remember where they were going', async () => {
    const route = await visit('/staff?tab=orders')

    expect(route.name).toBe('login')
    expect(route.query.redirect).toBe('/staff?tab=orders')
  })

  it('let each role into its own area', async () => {
    expect((await visit('/client/account', { user: USERS.client })).name).toBe('client-account')
    expect((await visit('/staff', { user: USERS.staff })).name).toBe('staff-home')
    expect((await visit('/admin', { user: USERS.admin })).name).toBe('admin-home')
  })

  it('let an administrator into the staff area', async () => {
    expect((await visit('/staff', { user: USERS.admin })).name).toBe('staff-home')
  })

  it.each([
    ['client', '/staff'],
    ['client', '/admin'],
    ['staff', '/admin'],
  ])('refuse a %s on %s', async (role, path) => {
    const route = await visit(path, { user: USERS[role] })

    expect(route.name).toBe('forbidden')
  })
})

describe('pages for visitors only', () => {
  it.each([
    ['client', 'client-account'],
    ['staff', 'staff-home'],
    ['admin', 'admin-home'],
  ])('send a signed-in %s to their own area instead of the login page', async (role, expected) => {
    expect((await visit('/login', { user: USERS[role] })).name).toBe(expected)
    expect((await visit('/register', { user: USERS[role] })).name).toBe(expected)
  })
})

describe('a session that survived a page reload', () => {
  it('is re-opened before the page is decided', async () => {
    session.setTokens({ refresh: 'r1' })
    vi.spyOn(authService, 'refreshSession').mockResolvedValue('a2')
    vi.spyOn(authService, 'me').mockResolvedValue(USERS.staff)

    const route = await visit('/staff', { restored: false })

    expect(route.name).toBe('staff-home')
  })

  it('does not trap a visitor whose stored session is dead', async () => {
    session.setTokens({ refresh: 'dead' })
    vi.spyOn(authService, 'refreshSession').mockRejectedValue(new Error('expired'))

    const route = await visit('/staff', { restored: false })

    expect(route.name).toBe('login')
  })
})

describe('the browser tab title', () => {
  it('names the page and the restaurant', async () => {
    await visit('/login')

    expect(document.title).toBe('Sign in · Restaurant')
  })

  it('follows the language', async () => {
    applyLocale('fr')
    setActivePinia(createPinia())
    const router = createAppRouter(createMemoryHistory())
    await router.push('/login')

    expect(document.title).toBe('Connexion · Restaurant')
    applyLocale('en')
  })
})
