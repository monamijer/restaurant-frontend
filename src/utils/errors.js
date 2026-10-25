import axios from 'axios'

/**
 * Every failure of an API call becomes an ApiError with the backend's envelope
 * ({ success: false, message, errors, code }) or a synthetic code when there is none.
 */
export class ApiError extends Error {
  constructor({ status = 0, code = 'UNKNOWN_ERROR', message = '', errors = {}, retryAfter = null, cause } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.errors = errors
    this.retryAfter = retryAfter
    this.cause = cause
  }

  get isNetworkError() {
    return this.status === 0
  }

  get isValidation() {
    return this.code === 'VALIDATION_ERROR'
  }
}

export function toApiError(error) {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    const { response } = error
    if (!response) {
      const code = error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK_ERROR'
      return new ApiError({ status: 0, code, message: error.message, cause: error })
    }
    const { data, status, headers } = response
    if (data && typeof data === 'object' && typeof data.code === 'string') {
      return new ApiError({
        status,
        code: data.code,
        message: data.message ?? '',
        errors: data.errors ?? {},
        retryAfter: headers?.['retry-after'] ?? null,
        cause: error,
      })
    }
    const code = status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR'
    return new ApiError({ status, code, message: error.message, cause: error })
  }

  return new ApiError({ code: 'UNKNOWN_ERROR', message: String(error?.message ?? error), cause: error })
}

/** The first message of each simple field error: { email: ['Taken.'] } becomes { email: 'Taken.' }. */
export function fieldErrors(error) {
  const flat = {}
  for (const [field, value] of Object.entries(error?.errors ?? {})) {
    if (Array.isArray(value) && typeof value[0] === 'string') flat[field] = value[0]
    else if (typeof value === 'string') flat[field] = value
  }
  return flat
}

const MESSAGE_KEY_BY_CODE = {
  NETWORK_ERROR: 'errors.network',
  TIMEOUT: 'errors.timeout',
  SERVER_ERROR: 'errors.server',
  THROTTLED: 'errors.throttled',
  AUTHENTICATION_FAILED: 'errors.authentication',
  PERMISSION_DENIED: 'errors.permission',
  NOT_FOUND: 'errors.notFound',
}

/** A message in the interface language for an error; falls back to the backend's own text. */
export function describeError(error, t) {
  const apiError = toApiError(error)
  const key = MESSAGE_KEY_BY_CODE[apiError.code]
  if (key) return t(key)
  return apiError.message || t('errors.unknown')
}
