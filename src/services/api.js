import axios from 'axios'
import { API_BASE_URL, API_TIMEOUT_MS } from '@/config'
import { toApiError } from '@/utils/errors'
import { session } from './session'

/**
 * The one Axios instance of the application. Components never use Axios directly: they call
 * the service modules, which call this client.
 *
 * Per-request flags:
 *   skipAuth      do not send the Authorization header (public endpoints)
 *   skipRefresh   a 401 must not trigger a token refresh (login, refresh itself)
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
})

let handleSessionExpired = () => {}

/** Called once at start-up: what to do when a session cannot be renewed any more. */
export function configureApi({ onSessionExpired }) {
  handleSessionExpired = onSessionExpired
}

// ---- Requests: attach the access token ----------------------------------------------
api.interceptors.request.use((config) => {
  const token = session.getAccessToken()
  if (token && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---- Token refresh ------------------------------------------------------------------
let refreshInFlight = null

/**
 * Swap the refresh token for a fresh pair. Concurrent callers share one request: the backend
 * rotates refresh tokens, so two parallel refreshes would invalidate each other.
 */
export function refreshTokens() {
  if (!refreshInFlight) {
    const refresh = session.getRefreshToken()
    if (!refresh) return Promise.reject(toApiError(new Error('No refresh token')))

    refreshInFlight = api
      .post('/auth/refresh/', { refresh }, { skipAuth: true, skipRefresh: true })
      .then(({ data }) => {
        session.setTokens({ access: data.access, refresh: data.refresh })
        return data.access
      })
      .catch((error) => {
        session.clear()
        throw toApiError(error)
      })
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

// Requests that were waiting on the same failed refresh share one error object: the
// application is told about the expired session once, not once per request.
const announcedFailures = new WeakSet()

// ---- Responses: renew expired sessions once, normalise every failure ------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    const canRefresh =
      response?.status === 401 &&
      config &&
      !config.skipRefresh &&
      !config._retried &&
      session.getRefreshToken()

    if (canRefresh) {
      config._retried = true
      try {
        await refreshTokens()
      } catch (refreshError) {
        if (!announcedFailures.has(refreshError)) {
          announcedFailures.add(refreshError)
          handleSessionExpired()
        }
        throw refreshError
      }
      return api(config)
    }

    if (import.meta.env.DEV && !response) {
      // A browser reports a blocked cross-origin call (CORS) exactly like a dead server.
      console.warn(
        `[api] No answer from ${API_BASE_URL}. If the backend is running, make sure CORS_ALLOWED_ORIGINS ` +
          `in its .env contains ${window.location.origin}, then restart the backend.`,
      )
    }
    throw toApiError(error)
  },
)
