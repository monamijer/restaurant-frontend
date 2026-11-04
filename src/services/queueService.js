import { api } from './api'

const PUBLIC = { skipAuth: true, skipRefresh: true }

export const queueService = {
  /** Public: how many parties wait and how long a party arriving now should expect. */
  async summary() {
    const { data } = await api.get('/queue/summary/', PUBLIC)
    return data
  },

  /** The customer's most recent tickets, newest first. */
  async mine() {
    const { data } = await api.get('/queue/', { params: { ordering: '-pk', page_size: 5 } })
    return data.results
  },

  async join({ partySize, phone }) {
    const body = { party_size: partySize }
    if (phone) body.phone = phone
    const { data } = await api.post('/queue/', body)
    return data
  },

  async cancel(id) {
    const { data } = await api.post(`/queue/${id}/cancel/`)
    return data
  },
}
