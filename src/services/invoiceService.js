import { api } from './api'

export const invoiceService = {
  async list(params) {
    const { data } = await api.get('/invoices/', { params })
    return data
  },

  /** The invoice of an order, or null while it has none (invoices are issued when paid). */
  async forOrder(orderId) {
    const { data } = await api.get('/invoices/', { params: { order: orderId } })
    return data.results[0] ?? null
  },

  /** The PDF as a Blob. It goes through the API because the file is private. */
  async downloadPdf(id) {
    const { data } = await api.get(`/invoices/${id}/download-pdf/`, { responseType: 'blob' })
    return data
  },
}
