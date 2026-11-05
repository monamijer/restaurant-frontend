import { api } from './api'

export const settingsService = {
  /** Public restaurant configuration: name, opening hours, tax rate... */
  async get() {
    const { data } = await api.get('/settings/', { skipAuth: true, skipRefresh: true })
    return data
  },

  /** Update the restaurant configuration. Admin only; the server validates every field. */
  async update(payload) {
    const { data } = await api.patch('/settings/', payload)
    return data
  },
}
