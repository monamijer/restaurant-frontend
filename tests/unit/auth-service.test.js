import { beforeEach, describe, expect, it } from 'vitest'
import { authService } from '@/services/authService'
import { session } from '@/services/session'
import { settingsService } from '@/services/settingsService'
import { envelope, fakeServer, reply } from '../helpers/http'

const USER = { id: 1, email: 'a@b.c', first_name: 'Ada', last_name: 'Lovelace', role: 'client' }

beforeEach(() => {
  session.clear()
})

describe('login', () => {
  it('stores the tokens, returns the user and ignores any old token', async () => {
    session.setTokens({ access: 'stale' })
    const requests = fakeServer((config) => reply(config, 200, { access: 'a1', refresh: 'r1', user: USER }))

    const user = await authService.login({ email: 'a@b.c', password: 'secret' })

    expect(user).toEqual(USER)
    expect(requests[0].url).toBe('/auth/login/')
    expect(requests[0].auth).toBeUndefined()
    expect(JSON.parse(requests[0].body)).toEqual({ email: 'a@b.c', password: 'secret' })
    expect(session.getAccessToken()).toBe('a1')
    expect(session.getRefreshToken()).toBe('r1')
  })

  it('rejects wrong credentials without touching the session', async () => {
    fakeServer((config) => reply(config, 401, envelope('AUTHENTICATION_FAILED', 'No active account.')))

    const error = await authService.login({ email: 'a@b.c', password: 'nope' }).catch((e) => e)

    expect(error.status).toBe(401)
    expect(session.getAccessToken()).toBeNull()
  })
})

describe('register', () => {
  it('creates the account without signing in', async () => {
    const requests = fakeServer((config) => reply(config, 201, USER))

    const created = await authService.register({ email: 'a@b.c', password: 'x' })

    expect(created).toEqual(USER)
    expect(requests[0].url).toBe('/auth/register/')
    expect(session.getAccessToken()).toBeNull()
  })
})

describe('logout', () => {
  it('forgets the tokens first and then revokes the refresh token', async () => {
    session.setTokens({ access: 'a1', refresh: 'r1' })
    const requests = fakeServer((config) => reply(config, 200))

    await authService.logout()

    expect(session.getRefreshToken()).toBeNull()
    expect(requests[0].url).toBe('/auth/logout/')
    expect(JSON.parse(requests[0].body)).toEqual({ refresh: 'r1' })
  })

  it('signs out locally even when the server cannot be reached', async () => {
    session.setTokens({ access: 'a1', refresh: 'r1' })
    fakeServer((config) => reply(config, 500, 'down'))

    await authService.logout()

    expect(session.getRefreshToken()).toBeNull()
    expect(session.getAccessToken()).toBeNull()
  })

  it('makes no request when there is nothing to revoke', async () => {
    const requests = fakeServer((config) => reply(config, 200))

    await authService.logout()

    expect(requests).toHaveLength(0)
  })
})

describe('profile and passwords', () => {
  it('reads and updates the profile with the access token', async () => {
    session.setTokens({ access: 'a1' })
    const requests = fakeServer((config) => reply(config, 200, USER))

    await authService.me()
    await authService.updateMe({ first_name: 'Grace' })

    expect(requests.map((request) => [request.method, request.url, request.auth])).toEqual([
      ['get', '/auth/me/', 'Bearer a1'],
      ['patch', '/auth/me/', 'Bearer a1'],
    ])
    expect(JSON.parse(requests[1].body)).toEqual({ first_name: 'Grace' })
  })

  it('changes the password with the field names the backend expects and keeps the new tokens', async () => {
    session.setTokens({ access: 'a1', refresh: 'r1' })
    const requests = fakeServer((config) => reply(config, 200, { access: 'a2', refresh: 'r2' }))

    await authService.changePassword({ oldPassword: 'old', newPassword: 'new' })

    expect(JSON.parse(requests[0].body)).toEqual({ old_password: 'old', new_password: 'new' })
    expect(session.getAccessToken()).toBe('a2')
    expect(session.getRefreshToken()).toBe('r2')
  })

  it('requests a reset link without credentials', async () => {
    const requests = fakeServer((config) => reply(config, 200))

    await authService.requestPasswordReset('a@b.c')

    expect(requests[0].url).toBe('/auth/password-reset/')
    expect(requests[0].auth).toBeUndefined()
    expect(JSON.parse(requests[0].body)).toEqual({ email: 'a@b.c' })
  })

  it('confirms a reset with the field names the backend expects', async () => {
    const requests = fakeServer((config) => reply(config, 204))

    await authService.confirmPasswordReset({ uid: 'MQ', token: 'tok', newPassword: 'fresh' })

    expect(requests[0].url).toBe('/auth/password-reset/confirm/')
    expect(JSON.parse(requests[0].body)).toEqual({ uid: 'MQ', token: 'tok', new_password: 'fresh' })
  })
})

describe('settingsService', () => {
  it('reads the public settings without a token', async () => {
    session.setTokens({ access: 'a1' })
    const requests = fakeServer((config) => reply(config, 200, { name: 'Chez Test' }))

    const settings = await settingsService.get()

    expect(settings.name).toBe('Chez Test')
    expect(requests[0].url).toBe('/settings/')
    expect(requests[0].auth).toBeUndefined()
  })
})
