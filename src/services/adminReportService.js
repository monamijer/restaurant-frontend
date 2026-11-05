import { api } from './api'

/**
 * Admin reports. Every report returns `{ start, end, results: [...] }`, and
 * every one of them can be downloaded as CSV with `export=csv`. The payments
 * report is CSV only; asking for it as JSON is a 400 on the backend.
 */
export const adminReportService = {
  async revenue(params) { return this.json('/reports/revenue/', params) },
  async orderVolume(params) { return this.json('/reports/order-volume/', params) },
  async topItems(params) { return this.json('/reports/top-items/', params) },
  async peakHours(params) { return this.json('/reports/peak-hours/', params) },
  async tableUtilization(params) { return this.json('/reports/table-utilization/', params) },

  async json(path, params = {}) {
    const { data } = await api.get(path, { params })
    return data
  },

  /** CSV body for the given report. Always blob so the browser can save it. */
  async csv(path, params = {}) {
    const { data } = await api.get(path, { params: { ...params, export: 'csv' }, responseType: 'blob' })
    return data
  },
}
