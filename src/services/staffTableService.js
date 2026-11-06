import { api } from './api'

/**
 * Staff-side table operations. The customer `tableService` only resolves QR
 * tokens; the staff floor needs the full list of tables, status changes and
 * the QR downloads.
 */
export const staffTableService = {
  /** One page of tables. Filters: status, min_capacity, location. */
  async list(params = {}) {
    const { data } = await api.get('/tables/', { params })
    return data
  },

  async get(id) {
    const { data } = await api.get(`/tables/${id}/`)
    return data
  },

  async create(payload) {
    const { data } = await api.post('/tables/', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.patch(`/tables/${id}/`, payload)
    return data
  },

  async remove(id) {
    await api.delete(`/tables/${id}/`)
  },

  async setStatus(id, status) {
    const { data } = await api.post(`/tables/${id}/set-status/`, { status })
    return data
  },

  /** PNG of the QR code of one table. */
  async downloadQrCode(id) {
    const { data } = await api.get(`/tables/${id}/qr-code/`, { responseType: 'blob' })
    return data
  },

  /** A4 PDF sheet with six codes per page. */
  async downloadQrSheet() {
    const { data } = await api.get('/tables/qr-sheet/', { responseType: 'blob' })
    return data
  },

  /** Invalidate every code already printed for that table. */
  async regenerateQr(id) {
    const { data } = await api.post(`/tables/${id}/regenerate-qr/`)
    return data
  },
}
