import { api } from './api'

/**
 * Staff and admin dashboard. Reads the aggregated snapshot built by the backend
 * (`GET /dashboard/stats/`), with an optional period and bucket size.
 */
export const adminDashboardService = {
  /**
   * @param {object} query - start (YYYY-MM-DD), end (YYYY-MM-DD), group_by (day|week|month)
   */
  async stats(query = {}) {
    const { data } = await api.get('/dashboard/stats/', { params: query })
    return data
  },
}
