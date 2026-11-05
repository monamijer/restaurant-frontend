import { api } from './api'

/**
 * Admin category CRUD. The public `menuService.categories()` reads the list;
 * this service only adds the write operations reserved for admins.
 */
export const adminCategoryService = {
  async list() {
    const { data } = await api.get('/categories/')
    return data
  },

  async create(payload) {
    const { data } = await api.post('/categories/', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.patch(`/categories/${id}/`, payload)
    return data
  },

  async remove(id) {
    await api.delete(`/categories/${id}/`)
  },
}
