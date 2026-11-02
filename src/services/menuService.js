import { api } from './api'

// The menu is public: it must load for visitors, and an expired token must not break it.
const PUBLIC = { skipAuth: true, skipRefresh: true }

export const menuService = {
  /** All categories, in display order (not paginated by the backend). */
  async categories() {
    const { data } = await api.get('/categories/', PUBLIC)
    return data
  },

  /** One page of dishes: { count, next, previous, results }. */
  async items(params) {
    const { data } = await api.get('/menu-items/', { ...PUBLIC, params })
    return data
  },

  async item(id) {
    const { data } = await api.get(`/menu-items/${id}/`, PUBLIC)
    return data
  },
}
