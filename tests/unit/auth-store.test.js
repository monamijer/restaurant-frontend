import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '@/services/authService'
import { session } from '@/services/session'
import { useAuthStore } from '@/store/auth'

const CLIENT = { id: 1, email: 'a@b.c', first_name: 'Ada', last_name: 'Lovelace', role: 'client' }
const STAFF = { ...CLIENT, id: 2, role: 'staff' }
const ADMIN = { ...CLIENT, id: 3, role: 'admin' }

beforeEach(() => {
  session.clear()
  setActivePinia(createPinia())
})

describe('getters', () => {
  it('describe a signed-out visitor', () => {
    const auth = useAuthStore()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.role).toBeNull()
    expect(auth.isStaff).toBe(false)
    expect(auth.isAdmin).toBe(false)
    expect(auth.fullName).toBe('')
  })

  it.each([
    [CLIENT, { isStaff: false, isAdmin: false }],
    [STAFF, { isStaff: true, isAdmin: false }],
    [ADMIN, { isStaff: true, isAdmin: true }],
  ])('describe the %j role', (user, expected) => {
    const auth = useAuthStore()
    auth.user = user

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.isStaff).toBe(expected.isStaff)
    expect(auth.isAdmin).toBe(expected.isAdmin)
    expect(auth.fullName).toBe('Ada Lovelace')
  })
})

describe('login and registration', () => {
  it('login keeps the user and marks the session as checked', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue(CLIENT)
    const auth = useAuthStore()

    await auth.login({ email: 'a@b.c', password: 'x' })

    expect(auth.user).toEqual(CLIENT)
    expect(auth.restored).toBe(true)
  })

  it('a failed login leaves the visitor signed out', async () => {
    vi.spyOn(authService, 'login').mockRejectedValue(new Error('bad credentials'))
    const auth = useAuthStore()

    await expect(auth.login({ email: 'a@b.c', password: 'x' })).rejects.toThrow('bad credentials')

    expect(auth.user).toBeNull()
  })

  it('registration signs the new customer straight in', async () => {
    const register = vi.spyOn(authService, 'register').mockResolvedValue(CLIENT)
    const login = vi.spyOn(authService, 'login').mockResolvedValue(CLIENT)
    const auth = useAuthStore()

    await auth.register({ email: 'a@b.c', password: 'Str0ng-pass!', first_name: 'Ada', last_name: 'L' })

    expect(register).toHaveBeenCalledOnce()
    expect(login).toHaveBeenCalledWith({ email: 'a@b.c', password: 'Str0ng-pass!' })
    expect(auth.user).toEqual(CLIENT)
  })

  it('does not sign in when registration fails', async () => {
    vi.spyOn(authService, 'register').mockRejectedValue(new Error('email taken'))
    const login = vi.spyOn(authService, 'login')
    const auth = useAuthStore()

    await expect(auth.register({ email: 'a@b.c', password: 'x' })).rejects.toThrow('email taken')

    expect(login).not.toHaveBeenCalled()
  })
})

describe('restoring a session after a page reload', () => {
  it('does nothing when there is no stored session', async () => {
    const refresh = vi.spyOn(authService, 'refreshSession')
    const auth = useAuthStore()

    await auth.restoreSession()

    expect(refresh).not.toHaveBeenCalled()
    expect(auth.user).toBeNull()
    expect(auth.restored).toBe(true)
  })

  it('renews the tokens and loads the user', async () => {
    session.setTokens({ refresh: 'r1' })
    vi.spyOn(authService, 'refreshSession').mockResolvedValue('a2')
    vi.spyOn(authService, 'me').mockResolvedValue(STAFF)
    const auth = useAuthStore()

    await auth.restoreSession()

    expect(auth.user).toEqual(STAFF)
    expect(auth.restored).toBe(true)
  })

  it('forgets a stored session that no longer works', async () => {
    session.setTokens({ refresh: 'dead' })
    vi.spyOn(authService, 'refreshSession').mockRejectedValue(new Error('expired'))
    const auth = useAuthStore()

    await auth.restoreSession()

    expect(auth.user).toBeNull()
    expect(auth.restored).toBe(true)
    expect(session.getRefreshToken()).toBeNull()
  })

  it('runs once even when the router asks several times at the same moment', async () => {
    session.setTokens({ refresh: 'r1' })
    const refresh = vi.spyOn(authService, 'refreshSession').mockResolvedValue('a2')
    vi.spyOn(authService, 'me').mockResolvedValue(CLIENT)
    const auth = useAuthStore()

    await Promise.all([auth.restoreSession(), auth.restoreSession(), auth.restoreSession()])
    await auth.restoreSession()

    expect(refresh).toHaveBeenCalledTimes(1)
  })
})

describe('leaving', () => {
  it('logout signs out locally', async () => {
    vi.spyOn(authService, 'logout').mockResolvedValue()
    const auth = useAuthStore()
    auth.user = CLIENT

    await auth.logout()

    expect(auth.user).toBeNull()
  })

  it('an expired session is forgotten without calling the server', () => {
    session.setTokens({ access: 'a1', refresh: 'r1' })
    const auth = useAuthStore()
    auth.user = CLIENT

    auth.expireSession()

    expect(auth.user).toBeNull()
    expect(session.getRefreshToken()).toBeNull()
    expect(auth.restored).toBe(true)
  })

  it('refreshUser reloads the profile', async () => {
    vi.spyOn(authService, 'me').mockResolvedValue({ ...CLIENT, first_name: 'Grace' })
    const auth = useAuthStore()
    auth.user = CLIENT

    await auth.refreshUser()

    expect(auth.fullName).toBe('Grace Lovelace')
  })
})
