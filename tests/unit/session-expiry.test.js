import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { applyLocale } from '@/i18n'
import { createAppRouter } from '@/router'
import { sessionExpiredHandler } from '@/router/expiry'
import { session } from '@/services/session'
import { useAuthStore } from '@/store/auth'
import { useToastStore } from '@/store/toasts'
import { USERS } from '../helpers/app'

async function startAt(path, user) {
  setActivePinia(createPinia())
  applyLocale('en')
  const auth = useAuthStore()
  auth.user = user
  auth.restored = true
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  return { router, auth, toasts: useToastStore() }
}

beforeEach(() => {
  session.clear()
})

describe('an expired session', () => {
  it('on a protected page forgets the user, says so and returns to sign in with the way back', async () => {
    session.setTokens({ access: 'a', refresh: 'r' })
    const { router, auth, toasts } = await startAt('/staff', USERS.staff)

    sessionExpiredHandler(router)()
    await router.isReady()
    await new Promise((resolve) => setTimeout(resolve))

    expect(auth.user).toBeNull()
    expect(session.getRefreshToken()).toBeNull()
    expect(toasts.items.map((toast) => toast.message)).toEqual(['Your session has expired. Please sign in again.'])
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/staff')
  })

  it('on a public page forgets the user but leaves the page alone', async () => {
    const { router, auth } = await startAt('/', USERS.client)

    sessionExpiredHandler(router)()
    await new Promise((resolve) => setTimeout(resolve))

    expect(auth.user).toBeNull()
    expect(router.currentRoute.value.name).toBe('home')
  })
})
