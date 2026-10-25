import { api, refreshTokens } from './api'
import { session } from './session'

const PUBLIC = { skipAuth: true, skipRefresh: true }

export const authService = {
  async login({ email, password }) {
    const { data } = await api.post('/auth/login/', { email, password }, PUBLIC)
    session.setTokens({ access: data.access, refresh: data.refresh })
    return data.user
  },

  async register(payload) {
    const { data } = await api.post('/auth/register/', payload, PUBLIC)
    return data
  },

  async logout() {
    const refresh = session.getRefreshToken()
    session.clear()
    if (!refresh) return
    try {
      await api.post('/auth/logout/', { refresh }, PUBLIC)
    } catch {
      // The local session is already gone; a failed revocation must not block signing out.
    }
  },

  /** Trade the stored refresh token for a new pair (used when the page is reloaded). */
  refreshSession: refreshTokens,

  async me() {
    const { data } = await api.get('/auth/me/')
    return data
  },

  async updateMe(changes) {
    const { data } = await api.patch('/auth/me/', changes)
    return data
  },

  async changePassword({ oldPassword, newPassword }) {
    const { data } = await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    })
    session.setTokens({ access: data.access, refresh: data.refresh })
  },

  async requestPasswordReset(email) {
    await api.post('/auth/password-reset/', { email }, PUBLIC)
  },

  async confirmPasswordReset({ uid, token, newPassword }) {
    await api.post('/auth/password-reset/confirm/', { uid, token, new_password: newPassword }, PUBLIC)
  },
}
