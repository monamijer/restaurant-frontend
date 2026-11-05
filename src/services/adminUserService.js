import { api } from './api'

/**
 * Admin account management. The backend exposes a ModelViewSet-like API on
 * `/users/` with no delete: accounts are deactivated instead.
 *
 * `create` sends the fields of the backend `UserCreateSerializer`, including
 * the role. `update` sends the fields of `UserUpdateSerializer`: identity
 * (email) and password are not editable there; the password has its own action.
 */
export const adminUserService = {
  /** One page of users. Filters: role, is_active, search, ordering, page. */
  async list(params = {}) {
    const { data } = await api.get('/users/', { params })
    return data
  },

  async get(id) {
    const { data } = await api.get(`/users/${id}/`)
    return data
  },

  async create(payload) {
    const { data } = await api.post('/users/', payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.patch(`/users/${id}/`, payload)
    return data
  },

  /** Set a new password; the backend signs the target user out everywhere. Returns 204. */
  async setPassword(id, password) {
    await api.post(`/users/${id}/set-password/`, { password })
  },

  /** Deactivate or reactivate an account. Deactivating signs the user out. */
  async setActive(id, isActive) {
    const { data } = await api.patch(`/users/${id}/`, { is_active: isActive })
    return data
  },
}
