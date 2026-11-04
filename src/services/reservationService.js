import { api } from './api'

export const reservationService = {
  /** One page of the signed-in customer's reservations. */
  async list(params) {
    const { data } = await api.get('/reservations/', { params })
    return data
  },

  /** Free start times of a day for a party and a duration, each with the tables that fit. */
  async availability({ date, partySize, duration }) {
    const { data } = await api.get('/reservations/availability/', {
      params: { date, party_size: partySize, duration_minutes: duration },
    })
    return data
  },

  async create(payload) {
    const { data } = await api.post('/reservations/', payload)
    return data
  },

  async cancel(id) {
    const { data } = await api.post(`/reservations/${id}/cancel/`)
    return data
  },
}
