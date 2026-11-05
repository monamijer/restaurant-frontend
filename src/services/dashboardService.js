import { api } from './api'

/**
 * Dashboard and report data for the staff and admin areas.
 * `api.md` says `/dashboard/stats/` is staff and accepts `start`, `end`,
 * `group_by` and `limit`; the home view only needs the default period.
 */
const dashboardService = {
  async stats(query = {}) {
    const response = await api.get('/dashboard/stats/', { params: query })
    return response.data
  },
}

export default dashboardService
