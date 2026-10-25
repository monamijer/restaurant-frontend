import { beforeEach, describe, expect, it, vi } from 'vitest'
import { REFRESH_TOKEN_KEY, session } from '@/services/session'

beforeEach(() => {
  session.clear()
})

describe('session', () => {
  it('keeps the access token in memory only', () => {
    session.setTokens({ access: 'a1', refresh: 'r1' })

    expect(session.getAccessToken()).toBe('a1')
    expect(JSON.stringify({ ...window.localStorage })).not.toContain('a1')
  })

  it('keeps the refresh token across reloads', () => {
    session.setTokens({ access: 'a1', refresh: 'r1' })

    expect(window.localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('r1')
    expect(session.getRefreshToken()).toBe('r1')
  })

  it('replaces the refresh token when the backend rotates it', () => {
    session.setTokens({ access: 'a1', refresh: 'r1' })
    session.setTokens({ access: 'a2', refresh: 'r2' })

    expect(session.getRefreshToken()).toBe('r2')
  })

  it('keeps what it has when only one token is given', () => {
    session.setTokens({ access: 'a1', refresh: 'r1' })
    session.setTokens({ access: 'a2' })

    expect(session.getAccessToken()).toBe('a2')
    expect(session.getRefreshToken()).toBe('r1')
  })

  it('forgets both tokens', () => {
    session.setTokens({ access: 'a1', refresh: 'r1' })

    session.clear()

    expect(session.getAccessToken()).toBeNull()
    expect(session.getRefreshToken()).toBeNull()
    expect(window.localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull()
  })

  it('still works when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })

    session.setTokens({ access: 'a1', refresh: 'r1' })

    expect(session.getRefreshToken()).toBe('r1')
  })
})
