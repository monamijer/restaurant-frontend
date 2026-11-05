import { api } from './api'

/**
 * Staff-side queue operations. The customer `queueService` only lets a client
 * join, read their own ticket and cancel it; the calls below are staff verbs
 * documented in the backend api.md.
 */
export const staffQueueService = {
  /** One page of tickets. Filters: status, active. */
  async list(params = {}) {
    const { data } = await api.get('/queue/', { params })
    return data
  },

  /** Call the first waiting ticket. The server picks it. */
  async callNext() {
    const { data } = await api.post('/queue/call-next/')
    return data
  },

  call(id) { return this.act(id, 'call') },
  seat(id) { return this.act(id, 'seat') },
  noShow(id) { return this.act(id, 'no-show') },
  cancel(id) { return this.act(id, 'cancel') },

  async act(id, action) {
    const { data } = await api.post(`/queue/${id}/${action}/`)
    return data
  },
}
