import axios, { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError, describeError, fieldErrors, toApiError } from '@/utils/errors'

function failure(status, data, headers = {}) {
  const config = {}
  return new AxiosError('boom', 'ERR_BAD_REQUEST', config, null, { status, data, headers, config })
}

describe('toApiError', () => {
  it('keeps the backend envelope', () => {
    const error = toApiError(
      failure(400, { success: false, code: 'VALIDATION_ERROR', message: 'Validation failed.', errors: { email: ['Taken.'] } }),
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(400)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.errors).toEqual({ email: ['Taken.'] })
    expect(error.isValidation).toBe(true)
  })

  it('reads how long to wait from a throttled answer', () => {
    const error = toApiError(failure(429, { code: 'THROTTLED', message: 'Slow down.' }, { 'retry-after': '30' }))

    expect(error.retryAfter).toBe('30')
  })

  it('treats a server crash without an envelope as a server error', () => {
    expect(toApiError(failure(502, '<html>Bad gateway</html>')).code).toBe('SERVER_ERROR')
  })

  it('treats other unexpected answers as unknown', () => {
    expect(toApiError(failure(404, 'Not found')).code).toBe('UNKNOWN_ERROR')
  })

  it('recognises a network failure and a timeout', () => {
    const offline = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'))
    const slow = toApiError(new AxiosError('timeout', 'ECONNABORTED'))

    expect(offline.code).toBe('NETWORK_ERROR')
    expect(offline.isNetworkError).toBe(true)
    expect(slow.code).toBe('TIMEOUT')
  })

  it('wraps a plain error and leaves an ApiError alone', () => {
    const original = new ApiError({ code: 'CONFLICT' })

    expect(toApiError(new Error('oops')).message).toBe('oops')
    expect(toApiError(original)).toBe(original)
    expect(axios.isAxiosError(toApiError(new Error('x')))).toBe(false)
  })
})

describe('fieldErrors', () => {
  it('keeps the first message of each field', () => {
    const error = new ApiError({ errors: { email: ['Taken.', 'Invalid.'], phone: 'Bad phone.' } })

    expect(fieldErrors(error)).toEqual({ email: 'Taken.', phone: 'Bad phone.' })
  })

  it('ignores nested errors that a page must handle itself', () => {
    const error = new ApiError({ errors: { items: [{ menu_item: ['Unavailable.'] }], name: ['Required.'] } })

    expect(fieldErrors(error)).toEqual({ name: 'Required.' })
  })

  it('copes with no errors at all', () => {
    expect(fieldErrors(new ApiError())).toEqual({})
    expect(fieldErrors(null)).toEqual({})
  })
})

describe('describeError', () => {
  const t = (key) => `t:${key}`

  it.each([
    ['NETWORK_ERROR', 't:errors.network'],
    ['TIMEOUT', 't:errors.timeout'],
    ['SERVER_ERROR', 't:errors.server'],
    ['THROTTLED', 't:errors.throttled'],
    ['AUTHENTICATION_FAILED', 't:errors.authentication'],
    ['PERMISSION_DENIED', 't:errors.permission'],
    ['NOT_FOUND', 't:errors.notFound'],
  ])('translates %s', (code, expected) => {
    expect(describeError(new ApiError({ code }), t)).toBe(expected)
  })

  it('falls back to the backend message, then to a generic one', () => {
    expect(describeError(new ApiError({ code: 'CONFLICT', message: 'Table already booked.' }), t)).toBe('Table already booked.')
    expect(describeError(new ApiError({ code: 'CONFLICT' }), t)).toBe('t:errors.unknown')
  })
})
