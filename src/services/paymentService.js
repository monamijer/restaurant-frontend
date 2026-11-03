import { api } from './api'

export const paymentService = {
  /** The payments of one order, newest first. */
  async forOrder(orderId) {
    const { data } = await api.get('/payments/', { params: { order: orderId, ordering: '-created_at' } })
    return data.results
  },

  /**
   * Start a payment. There is no amount: the server charges the order total. Card and mobile
   * money send an opaque token made by the payment provider, never a card number.
   */
  async pay({ order, method, token }) {
    const body = { order, method }
    if (token) body.payment_token = token
    const { data } = await api.post('/payments/', body)
    return data
  },

  async cancel(id) {
    const { data } = await api.post(`/payments/${id}/cancel/`)
    return data
  },
}
