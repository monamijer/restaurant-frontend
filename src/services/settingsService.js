import { api } from './api'

export const settingsService = {
  /** Public restaurant configuration: name, opening hours, tax rate... */
  async get() {
    const { data } = await api.get('/settings/', { skipAuth: true, skipRefresh: true })
    return data
  },
}
