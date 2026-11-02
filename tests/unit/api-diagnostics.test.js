import { AxiosError } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL } from '@/config'
import { api } from '@/services/api'
import { fakeServer, reply } from '../helpers/http'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('development hint for an unreachable backend', () => {
  it('names the page origin the backend must allow', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    fakeServer(() => Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK')))

    await api.post('/auth/login/', {}).catch(() => {})

    expect(warn).toHaveBeenCalledOnce()
    const message = warn.mock.calls[0][0]
    expect(message).toContain(API_BASE_URL)
    expect(message).toContain('CORS_ALLOWED_ORIGINS')
    expect(message).toContain(window.location.origin)
  })

  it('stays quiet when the backend answered, even with an error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    fakeServer((config) => reply(config, 500, 'down'))

    await api.get('/menu-items/').catch(() => {})

    expect(warn).not.toHaveBeenCalled()
  })
})
