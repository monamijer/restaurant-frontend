import { api } from './api'

export const orderService = {
  /** Create an order from the cart lines. The server prices everything. */
  async create(payload) {
    const { data } = await api.post('/orders/', payload)
    return data
  },

  async get(id) {
    const { data } = await api.get(`/orders/${id}/`)
    return data
  },

  /** One page of the signed-in customer's orders, newest first. */
  async list(params) {
    const { data } = await api.get('/orders/', { params })
    return data
  },

  async cancel(id) {
    const { data } = await api.post(`/orders/${id}/cancel/`)
    return data
  },
}
