import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, configureApi } from '@/services/api'
import { session } from '@/services/session'
import { ApiError } from '@/utils/errors'
import { envelope, fakeServer, reply } from '../helpers/http'

const REFRESH_URL = '/auth/refresh/'
let expired

beforeEach(() => {
  session.clear()
  expired = vi.fn()
  configureApi({ onSessionExpired: expired })
})

const expiredToken = (config) => reply(config, 401, envelope('AUTHENTICATION_FAILED', 'Token expired.'))

describe('requests', () => {
  it('sends the access token when there is one', async () => {
    session.setTokens({ access: 'abc' })
    const requests = fakeServer((config) => reply(config, 200, { ok: true }))

    await api.get('/orders/')

    expect(requests[0].auth).toBe('Bearer abc')
  })

  it('sends nothing when signed out', async () => {
    const requests = fakeServer((config) => reply(config, 200))

    await api.get('/menu-items/')

    expect(requests[0].auth).toBeUndefined()
  })

  it('leaves the token out of public requests', async () => {
    session.setTokens({ access: 'abc' })
    const requests = fakeServer((config) => reply(config, 200))

    await api.get('/settings/', { skipAuth: true })

    expect(requests[0].auth).toBeUndefined()
  })
})

describe('failures', () => {
  it('become ApiErrors carrying the backend envelope', async () => {
    fakeServer((config) => reply(config, 400, envelope('VALIDATION_ERROR', 'Validation failed.', { email: ['Taken.'] })))

    const error = await api.post('/auth/register/', {}).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(400)
    expect(error.errors).toEqual({ email: ['Taken.'] })
  })

  it('report a missing network clearly', async () => {
    fakeServer(() => Promise.reject(Object.assign(new Error('Network Error'), { isAxiosError: true, code: 'ERR_NETWORK' })))

    const error = await api.get('/menu-items/').catch((e) => e)

    expect(error.code).toBe('NETWORK_ERROR')
  })
})

describe('an expired access token', () => {
  it('is renewed, then the request is replayed with the new token', async () => {
    session.setTokens({ access: 'old', refresh: 'r1' })
    const requests = fakeServer((config) => {
      if (config.url === REFRESH_URL) return reply(config, 200, { access: 'new', refresh: 'r2' })
      if (config.headers.Authorization === 'Bearer new') return reply(config, 200, { ok: true })
      return expiredToken(config)
    })

    const { data } = await api.get('/orders/')

    expect(data).toEqual({ ok: true })
    expect(requests.map((request) => request.url)).toEqual(['/orders/', REFRESH_URL, '/orders/'])
    expect(requests[1].auth).toBeUndefined()
    expect(JSON.parse(requests[1].body)).toEqual({ refresh: 'r1' })
    expect(session.getAccessToken()).toBe('new')
    expect(session.getRefreshToken()).toBe('r2')
  })

  it('triggers a single renewal for requests that fail together', async () => {
    session.setTokens({ access: 'old', refresh: 'r1' })
    const requests = fakeServer((config) => {
      if (config.url === REFRESH_URL) return reply(config, 200, { access: 'new', refresh: 'r2' })
      if (config.headers.Authorization === 'Bearer new') return reply(config, 200, { ok: true })
      return expiredToken(config)
    })

    await Promise.all([api.get('/orders/'), api.get('/payments/'), api.get('/invoices/')])

    expect(requests.filter((request) => request.url === REFRESH_URL)).toHaveLength(1)
  })

  it('ends the session when it cannot be renewed, and says so only once', async () => {
    session.setTokens({ access: 'old', refresh: 'r1' })
    fakeServer(expiredToken)

    const results = await Promise.allSettled([api.get('/orders/'), api.get('/payments/')])

    expect(results.every((result) => result.status === 'rejected')).toBe(true)
    expect(results[0].reason).toBeInstanceOf(ApiError)
    expect(results[0].reason.status).toBe(401)
    expect(session.getRefreshToken()).toBeNull()
    expect(session.getAccessToken()).toBeNull()
    expect(expired).toHaveBeenCalledTimes(1)
  })

  it('is not renewed when there is no refresh token to renew it with', async () => {
    const requests = fakeServer(expiredToken)

    const error = await api.get('/orders/').catch((e) => e)

    expect(error.status).toBe(401)
    expect(requests).toHaveLength(1)
    expect(expired).not.toHaveBeenCalled()
  })

  it('is not renewed for requests that opt out, such as a wrong password', async () => {
    session.setTokens({ refresh: 'r1' })
    const requests = fakeServer((config) => reply(config, 401, envelope('AUTHENTICATION_FAILED', 'Bad credentials.')))

    const error = await api.post('/auth/login/', {}, { skipAuth: true, skipRefresh: true }).catch((e) => e)

    expect(error.status).toBe(401)
    expect(requests).toHaveLength(1)
    expect(session.getRefreshToken()).toBe('r1')
  })

  it('is replayed only once, so a rejection after renewal cannot loop', async () => {
    session.setTokens({ access: 'old', refresh: 'r1' })
    const requests = fakeServer((config) => {
      if (config.url === REFRESH_URL) return reply(config, 200, { access: 'new', refresh: 'r2' })
      return expiredToken(config)
    })

    const error = await api.get('/orders/').catch((e) => e)

    expect(error.status).toBe(401)
    expect(requests.map((request) => request.url)).toEqual(['/orders/', REFRESH_URL, '/orders/'])
    expect(session.getRefreshToken()).toBe('r2')
  })
})
