import { api } from './api'

/**
 * Staff-side reservation operations. Customers can only create and cancel
 * their own reservations; the status transitions below are for staff.
 */
export const staffReservationService = {
  /** One page of reservations. Filters: status, table, date. */
  async list(params = {}) {
    const { data } = await api.get('/reservations/', { params })
    return data
  },

  /** Move a reservation forward. `action` is one of the documented staff verbs. */
  async act(id, action) {
    const { data } = await api.post(`/reservations/${id}/${action}/`)
    return data
  },

  confirm(id) { return this.act(id, 'confirm') },
  reject(id) { return this.act(id, 'reject') },
  complete(id) { return this.act(id, 'complete') },
  noShow(id) { return this.act(id, 'no-show') },
  cancel(id) { return this.act(id, 'cancel') },
}
